'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
}

interface AddVisitModalProps {
  onClose: () => void;
  onSuccess: () => void;
  preselectedPatientId?: number;
}

interface FormErrors {
  [key: string]: string;
}

// Validation patterns for new patient form
const validationPatterns = {
  first_name: /^[a-zA-Z\s.'-]+$/,
  last_name: /^[a-zA-Z\s.'-]+$/,
  phone: /^(\+91[\s-]?)?[6-9]\d{9}$/,
  address: /^[a-zA-Z0-9\s\-.,()&#]+$/,
  emergency_contact: /^(\+91[\s-]?)?[6-9]\d{9}$/,
};

// Validation error messages for new patient form
const validationMessages = {
  first_name: 'First name should contain only letters, spaces, dots, apostrophes, and hyphens',
  last_name: 'Last name should contain only letters, spaces, dots, apostrophes, and hyphens',
  phone: 'Phone number must be a valid Indian mobile number (10 digits)',
  address: 'Address should contain only letters, numbers, spaces, and basic punctuation',
  blood_group: 'Blood group must be valid (e.g., A+, B-, AB+, O-)',
  emergency_contact: 'Emergency contact must be a valid Indian mobile number (10 digits)',
};

export default function AddVisitModal({ onClose, onSuccess, preselectedPatientId }: AddVisitModalProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [formData, setFormData] = useState({
    patient_id: preselectedPatientId?.toString() || '',
    visit_date: new Date().toISOString().split('T')[0],
    chief_complaint: '',
    symptoms: '',
    diagnosis: '',
    prescription: '',
    notes: '',
    follow_up_date: '',
    vitals: {
      temperature: '',
      bp: '',
      pulse: '',
      weight: '',
      o2: ''
    },
    height: '',
    // New patient fields
    first_name: '',
    last_name: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    blood_group: '',
    allergies: '',
    emergency_contact: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState(preselectedPatientId ? 1 : 1);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [patientType, setPatientType] = useState<'existing' | 'new' | null>(preselectedPatientId ? 'existing' : null);
  const totalSteps = patientType === 'new' ? 5 : (preselectedPatientId ? 2 : 4);

  // Focus management
  const modalRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  useEffect(() => {
    if (patientType === 'existing') {
      fetchPatients();
    }
  }, [patientType]);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients?limit=100');
      const data = await response.json();
      if (data.success) {
        setPatients(data.data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  // Validation function
  const validateField = (name: string, value: string): string => {
    // Validate new patient fields
    if (['first_name', 'last_name', 'age', 'phone', 'gender', 'address'].includes(name)) {
      if (!value.trim()) {
        return 'This field is required';
      }
      const pattern = validationPatterns[name as keyof typeof validationPatterns];
      if (pattern && value.trim() && !pattern.test(value.trim())) {
        return validationMessages[name as keyof typeof validationMessages];
      }
      if (name === 'age' && value) {
        const age = parseInt(value);
        if (isNaN(age) || age <= 0 || age > 120) {
          return 'Please enter a valid age (1-120)';
        }
      }
    }

    // Validate visit fields
    if (!value.trim() && ['patient_id', 'visit_date', 'chief_complaint'].includes(name)) {
      return 'This field is required';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('vitals.')) {
      const vitalName = name.split('.')[1];
      setFormData({
        ...formData,
        vitals: {
          ...formData.vitals,
          [vitalName]: value
        }
      });
    } else {
      // Special handling for phone number inputs - only allow digits
      if (name === 'phone' || name === 'emergency_contact') {
        const numericValue = value.replace(/\D/g, ''); // Remove all non-digits
        if (numericValue.length <= 10) { // Limit to 10 digits
          setFormData({
            ...formData,
            [name]: numericValue
          });
        }
      } else {
        setFormData({
          ...formData,
          [name]: value
        });
      }
    }

    // Validate on change if field has been touched
    if (touchedFields.has(name)) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error || '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (value.trim() !== '') {
      setTouchedFields(prev => new Set(prev).add(name));
      const error = validateField(name, value);
      if (error) {
        setErrors(prev => ({ ...prev, [name]: error }));
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Only submit on final step
    if (currentStep < totalSteps) {
      return;
    }

    // Validate required fields
    const newErrors: FormErrors = {};
    const requiredFields = patientType === 'new' 
      ? ['first_name', 'last_name', 'age', 'phone', 'gender', 'address', 'visit_date', 'chief_complaint']
      : ['patient_id', 'visit_date', 'chief_complaint'];
    
    requiredFields.forEach(key => {
      const value = formData[key as keyof typeof formData];
      // Skip validation for non-string values (like the vitals object)
      if (typeof value === 'string') {
        const error = validateField(key, value);
        if (error) {
          newErrors[key] = error;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    setLoading(true);
    try {
      let patientId = parseInt(formData.patient_id);
      
      // If new patient, create patient first
      if (patientType === 'new') {
        const patientData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          age: parseInt(formData.age),
          gender: formData.gender,
          phone: formData.phone,
          address: formData.address,
          blood_group: formData.blood_group.trim() || null,
          allergies: formData.allergies.trim() || 'None',
          emergency_contact: formData.emergency_contact.trim() || null
        };

        const patientResponse = await fetch('/api/patients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(patientData),
        });

        const patientResult = await patientResponse.json();
        if (!patientResponse.ok) {
          toast.error(patientResult.error || 'Failed to create patient');
          setErrors({ general: patientResult.error || 'Failed to create patient' });
          setLoading(false);
          return;
        }
        patientId = patientResult.data.id;
      }

      // Prepare vitals data
      const vitalsData = Object.entries(formData.vitals)
        .filter(([, value]) => value.trim() !== '')
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);

      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patientId,
          visit_date: formData.visit_date,
          chief_complaint: formData.chief_complaint,
          symptoms: formData.symptoms,
          diagnosis: formData.diagnosis,
          prescription: formData.prescription,
          notes: formData.notes,
          follow_up_date: formData.follow_up_date || null,
          vitals: Object.keys(vitalsData).length > 0 ? vitalsData : null
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Visit added successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to create visit');
        setErrors({ general: result.error || 'Failed to create visit' });
      }
    } catch {
      toast.error('Network error. Please try again.');
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    const currentStepFields = getCurrentStepFields();
    
    // Mark all fields in current step as touched
    setTouchedFields(prev => {
      const newTouched = new Set(prev);
      currentStepFields.forEach(field => newTouched.add(field));
      return newTouched;
    });

    // Validate all fields in current step
    const newErrors: FormErrors = {};
    currentStepFields.forEach(field => {
      let value: string | undefined;
      if (field.startsWith('vitals.')) {
        const vitalsKey = field.split('.')[1] as keyof typeof formData.vitals;
        value = formData.vitals?.[vitalsKey]?.toString();
      } else {
        const formValue = formData[field as keyof typeof formData];
        value = formValue !== undefined && formValue !== null ? formValue.toString() : '';
      }
      
      if (value !== undefined) {
        const error = validateField(field, value);
        if (error) {
          newErrors[field] = error;
        }
      }
    });
    setErrors(prev => ({ ...prev, ...newErrors }));

    if (currentStep < totalSteps && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && currentStep < totalSteps) {
        e.preventDefault();
        if (canProceed()) nextStep();
      } else if (currentStep < totalSteps) {
        e.preventDefault();
      }
    }
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  };

  const canProceed = () => {
    const currentStepFields = getCurrentStepFields();
    const requiredFields = patientType === 'new' && currentStep <= 2
      ? ['first_name', 'last_name', 'age', 'phone', 'gender', 'address']
      : ['patient_id', 'visit_date', 'chief_complaint'];
    
    return currentStepFields.every(field => {
      if (currentStep === 1 && patientType === null) {
        return patientType !== null;
      }
      
      if (patientType === 'new' && currentStep <= 2) {
        if (requiredFields.includes(field)) {
          const value = formData[field as keyof typeof formData];
          const hasValue = field === 'gender' || (value && (value as string).trim() !== '');
          const hasNoError = !errors[field];
          return hasValue && hasNoError;
        }
        return true;
      }
      
      if (patientType === 'existing' && currentStep === 2) {
        if (requiredFields.includes(field)) {
          const value = formData[field as keyof typeof formData];
          const hasValue = value && (value as string).trim() !== '';
          const hasNoError = !errors[field];
          return hasValue && hasNoError;
        }
        return true;
      }
      
      if (field.startsWith('vitals.')) {
        return true; // Vitals are optional
      }
      
      if (requiredFields.includes(field)) {
        const value = formData[field as keyof typeof formData];
        const hasValue = value && (value as string).trim() !== '';
        const hasNoError = !errors[field];
        return hasValue && hasNoError;
      }
      
      return true;
    });
  };

  const getCurrentStepFields = () => {
    if (patientType === 'new') {
      switch (currentStep) {
        case 1:
          return ['patient_type'];
        case 2:
          return ['first_name', 'last_name', 'age', 'gender', 'phone', 'address'];
        case 3:
          return ['blood_group', 'allergies', 'emergency_contact'];
        case 4:
          return ['visit_date', 'follow_up_date'];
        case 5:
          return ['chief_complaint', 'symptoms', 'diagnosis', 'prescription'];
        case 6:
          return ['vitals.temperature', 'vitals.blood_pressure', 'vitals.pulse', 'vitals.weight', 'vitals.height', 'notes'];
        default:
          return [];
      }
    } else {
      switch (currentStep) {
        case 1:
          return ['patient_type'];
        case 2:
          return ['patient_id', 'visit_date', 'follow_up_date'];
        case 3:
          return ['chief_complaint', 'symptoms', 'diagnosis', 'prescription'];
        case 4:
          return ['vitals.temperature', 'vitals.blood_pressure', 'vitals.pulse', 'vitals.weight', 'vitals.height', 'notes'];
        default:
          return [];
      }
    }
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const selectPatient = (patient: Patient) => {
    setFormData({ ...formData, patient_id: patient.id.toString() });
    setSearchTerm(`${patient.first_name} ${patient.last_name}`);
  };

  const renderInput = (label: string, name: string, type = 'text', required = false, placeholder = '') => {
    const value = name.startsWith('vitals.') 
      ? formData.vitals[name.split('.')[1] as keyof typeof formData.vitals] as string
      : formData[name as keyof Omit<typeof formData, 'vitals'>] as string;
      
    return (
      <div>
        <label htmlFor={name} className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={type === 'tel' ? 10 : undefined}
          placeholder={placeholder}
          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
            errors[name] 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-gray-900'
          }`}
        />
        {errors[name] && (
          <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    // If patient is preselected, skip to visit details
    if (preselectedPatientId) {
      switch (currentStep) {
        case 1:
          return (
            <div className="space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Visit Details</h3>
                <p className="text-xs sm:text-sm text-gray-600">Medical examination information</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInput("Visit Date", "visit_date", "date", true)}
                {renderInput("Follow-up Date", "follow_up_date", "date", false)}
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Chief Complaint <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="chief_complaint"
                    value={formData.chief_complaint}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    rows={2}
                    placeholder="Main reason for visit"
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      errors.chief_complaint 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-gray-900'
                    }`}
                  />
                  {errors.chief_complaint && (
                    <p className="mt-1 text-sm text-red-600">{errors.chief_complaint}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Symptoms
                  </label>
                  <textarea
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Detailed symptoms observed"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Diagnosis
                  </label>
                  <textarea
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Medical diagnosis"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Prescription
                  </label>
                  <textarea
                    name="prescription"
                    value={formData.prescription}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Medications and dosage instructions"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>
          );
        case 2:
          return (
            <div className="space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Vital Signs & Notes</h3>
                <p className="text-xs sm:text-sm text-gray-600">Patient vital measurements and additional notes</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInput("Temperature", "vitals.temperature", "text", false, "e.g., 98.6°F")}
                {renderInput("Blood Pressure", "vitals.blood_pressure", "text", false, "e.g., 120/80")}
                {renderInput("Pulse Rate", "vitals.pulse", "text", false, "e.g., 72 bpm")}
                {renderInput("Weight", "vitals.weight", "text", false, "e.g., 70 kg")}
                {renderInput("O2 Saturation", "vitals.o2", "text", false, "e.g., 98%")}
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any additional observations or instructions"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>
          );
        default:
          return null;
      }
    }

    // Normal flow when no patient is preselected
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Patient Type</h3>
              <p className="text-xs sm:text-sm text-gray-600">Is this an existing or new patient?</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={() => setPatientType('existing')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    patientType === 'existing'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Existing Patient
                </button>
                <button
                  type="button"
                  onClick={() => setPatientType('new')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    patientType === 'new'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  New Patient
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
        if (patientType === 'new') {
          return (
            <div className="space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Basic Information</h3>
                <p className="text-xs sm:text-sm text-gray-600">New patient&apos;s personal details</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInput("First Name", "first_name", "text", true, "e.g., Rahul")}
                {renderInput("Last Name", "last_name", "text", true, "e.g., Sharma")}
                {renderInput("Age", "age", "number", true, "e.g., 35")}
                <div>
                  <label htmlFor="gender" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      errors.gender 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-gray-900'
                    }`}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                  )}
                </div>
                {renderInput("Phone", "phone", "tel", true, "e.g., 9876543210")}
                <div className="md:col-span-2">
                  {renderInput("Address", "address", "text", true, "e.g., Flat 203, Krishna Heights, Sector 12, Vashi, Navi Mumbai - 400703")}
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Patient Selection</h3>
                <p className="text-xs sm:text-sm text-gray-600">Search and select existing patient</p>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Search Patient <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      errors.patient_id 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-gray-900'
                    }`}
                  />
                  {errors.patient_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.patient_id}</p>
                  )}
                </div>
                {searchTerm && (
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => selectPatient(patient)}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                            formData.patient_id === patient.id.toString() ? 'bg-gray-100' : ''
                          }`}
                        >
                          {patient.first_name} {patient.last_name} - {patient.phone}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">No patients found</div>
                    )}
                  </div>
                )}
                {renderInput("Visit Date", "visit_date", "date", true)}
                {renderInput("Follow-up Date", "follow_up_date", "date", false)}
              </div>
            </div>
          );
        }

      case 3:
        if (patientType === 'new') {
          return (
            <div className="space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Medical Information</h3>
                <p className="text-xs sm:text-sm text-gray-600">Additional medical details</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="blood_group" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Blood Group
                  </label>
                  <select
                    id="blood_group"
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="allergies" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Known Allergies
                  </label>
                  <textarea
                    id="allergies"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    rows={3}
                    placeholder="List any known allergies (Leave empty if none)"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  />
                </div>
                {renderInput("Emergency Contact", "emergency_contact", "tel", false, "e.g., 8765432109")}
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Visit Details</h3>
                <p className="text-xs sm:text-sm text-gray-600">Medical examination information</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Chief Complaint <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="chief_complaint"
                    value={formData.chief_complaint}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    rows={2}
                    placeholder="Main reason for visit"
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      errors.chief_complaint 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-gray-900'
                    }`}
                  />
                  {errors.chief_complaint && (
                    <p className="mt-1 text-sm text-red-600">{errors.chief_complaint}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Symptoms
                  </label>
                  <textarea
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Detailed symptoms observed"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Diagnosis
                  </label>
                  <textarea
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Medical diagnosis"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Prescription
                  </label>
                  <textarea
                    name="prescription"
                    value={formData.prescription}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Medications and dosage instructions"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>
          );
        }

      case 4:
        if (patientType === 'new') {
          return (
            <div className="space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Visit Details</h3>
                <p className="text-xs sm:text-sm text-gray-600">Medical examination information</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInput("Visit Date", "visit_date", "date", true)}
                {renderInput("Follow-up Date", "follow_up_date", "date", false)}
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Chief Complaint <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="chief_complaint"
                    value={formData.chief_complaint}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    rows={2}
                    placeholder="Main reason for visit"
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      errors.chief_complaint 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-gray-900'
                    }`}
                  />
                  {errors.chief_complaint && (
                    <p className="mt-1 text-sm text-red-600">{errors.chief_complaint}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Symptoms
                  </label>
                  <textarea
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Detailed symptoms observed"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Diagnosis
                  </label>
                  <textarea
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Medical diagnosis"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Prescription
                  </label>
                  <textarea
                    name="prescription"
                    value={formData.prescription}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Medications and dosage instructions"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Vital Signs & Notes</h3>
                <p className="text-xs sm:text-sm text-gray-600">Patient vital measurements and additional notes</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInput("Temperature", "vitals.temperature", "text", false, "e.g., 98.6°F")}
                {renderInput("Blood Pressure", "vitals.blood_pressure", "text", false, "e.g., 120/80")}
                {renderInput("Pulse Rate", "vitals.pulse", "text", false, "e.g., 72 bpm")}
                {renderInput("Weight", "vitals.weight", "text", false, "e.g., 70 kg")}
                {renderInput("O2 Saturation", "vitals.o2", "text", false, "e.g., 98%")}
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any additional observations or instructions"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>
          );
        }

      case 5:
        if (patientType === 'new') {
          return (
            <div className="space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Vital Signs & Notes</h3>
                <p className="text-xs sm:text-sm text-gray-600">Patient vital measurements and additional notes</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInput("Temperature", "vitals.temperature", "text", false, "e.g., 98.6°F")}
                {renderInput("Blood Pressure", "vitals.blood_pressure", "text", false, "e.g., 120/80")}
                {renderInput("Pulse Rate", "vitals.pulse", "text", false, "e.g., 72 bpm")}
                {renderInput("Weight", "vitals.weight", "text", false, "e.g., 70 kg")}
                {renderInput("O2 Saturation", "vitals.o2", "text", false, "e.g., 98%")}
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any additional observations or instructions"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Vital Signs & Notes</h3>
                <p className="text-xs sm:text-sm text-gray-600">Patient vital measurements and additional notes</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInput("Temperature", "vitals.temperature", "text", false, "e.g., 98.6°F")}
                {renderInput("Blood Pressure", "vitals.blood_pressure", "text", false, "e.g., 120/80")}
                {renderInput("Pulse Rate", "vitals.pulse", "text", false, "e.g., 72 bpm")}
                {renderInput("Weight", "vitals.weight", "text", false, "e.g., 70 kg")}
                {renderInput("O2 Saturation", "vitals.o2", "text", false, "e.g., 98%")}
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any additional observations or instructions"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>
          );
        }

      case 6:
        if (patientType === 'new') {
          return (
            <div className="space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Vital Signs & Notes</h3>
                <p className="text-xs sm:text-sm text-gray-600">Patient vital measurements and additional notes</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInput("Temperature", "vitals.temperature", "text", false, "e.g., 98.6°F")}
                {renderInput("Blood Pressure", "vitals.blood_pressure", "text", false, "e.g., 120/80")}
                {renderInput("Pulse Rate", "vitals.pulse", "text", false, "e.g., 72 bpm")}
                {renderInput("Weight", "vitals.weight", "text", false, "e.g., 70 kg")}
                {renderInput("O2 Saturation", "vitals.o2", "text", false, "e.g., 98%")}
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any additional observations or instructions"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>
          );
        }

      default:
        return null;
    }
  };

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-[99999] p-2 sm:p-4"
        onClick={onClose}
        onKeyDown={handleOverlayKeyDown}
        aria-hidden={false}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-4xl h-[82vh] sm:h-[85vh] lg:h-[94vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabIndex={-1}
          ref={modalRef}
        >
          {/* Header */}
          <div className="border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-gray-800">Add New Visit</h2>
                <p className="text-gray-600 text-xs sm:text-sm mt-0.5 sm:mt-1">Step {currentStep} of {totalSteps}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl p-1"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            {/* Progress Bar */}
            <div className="mt-2">
              <div className="hidden sm:flex justify-between text-xs text-gray-500 mb-2">
                {patientType === 'new' ? (
                  <>
                    <span>Patient Type</span>
                    <span>Basic Info</span>
                    <span>Medical Info</span>
                    <span>Visit Details</span>
                    <span>Vitals & Notes</span>
                  </>
                ) : preselectedPatientId ? (
                  <>
                    <span>Visit Details</span>
                    <span>Vitals & Notes</span>
                  </>
                ) : (
                  <>
                    <span>Patient Type</span>
                    <span>Patient Selection</span>
                    <span>Visit Details</span>
                    <span>Vitals & Notes</span>
                  </>
                )}
              </div>
              <div className="sm:hidden text-center text-xs text-gray-500 mb-2">
                Step {currentStep} of {totalSteps}: {patientType === 'new' 
                  ? ['Patient Type', 'Basic Information', 'Medical Information', 'Visit Details', 'Vital Signs & Notes'][currentStep - 1]
                  : preselectedPatientId 
                    ? ['Visit Details', 'Vital Signs & Notes'][currentStep - 1]
                    : ['Patient Type', 'Patient Selection', 'Visit Details', 'Vital Signs & Notes'][currentStep - 1]}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-900 rounded-full h-2 transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {/* Content */}
            <div className="flex-1 min-h-0 relative">
              <div className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent p-3 sm:p-4 md:p-5">
                {errors.general && (
                  <div className="p-4 bg-red-50/50 backdrop-blur-sm border border-red-200 text-red-700 rounded-lg mb-6">
                    {errors.general}
                  </div>
                )}
                <form id="visit-form" onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
                  {renderStepContent()}
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center border-t flex-shrink-0">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Previous
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !canProceed()}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </span>
                    ) : (
                      'Add Visit'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}