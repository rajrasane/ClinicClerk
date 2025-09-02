'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface AddPatientModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  [key: string]: string;
}

// Validation patterns
const validationPatterns = {
  first_name: /^[a-zA-Z\s.'-]+$/,
  last_name: /^[a-zA-Z\s.'-]+$/,
  phone: /^(\+91[\s-]?)?[6-9]\d{9}$/,
  address: /^[a-zA-Z0-9\s\-.,()&#]+$/,
  emergency_contact: /^(\+91[\s-]?)?[6-9]\d{9}$/,
};

// Validation error messages
const validationMessages = {
  first_name: 'First name should contain only letters, spaces, dots, apostrophes, and hyphens',
  last_name: 'Last name should contain only letters, spaces, dots, apostrophes, and hyphens',
  phone: 'Phone number must be a valid Indian mobile number (10 digits)',
  address: 'Address should contain only letters, numbers, spaces, and basic punctuation',
  blood_group: 'Blood group must be valid (e.g., A+, B-, AB+, O-)',
  emergency_contact: 'Emergency contact must be a valid Indian mobile number (10 digits)',
};

export default function AddPatientModal({ onClose, onSuccess }: AddPatientModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    address: '',
    blood_group: '',
    allergies: '',
    emergency_contact: ''
  });
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const totalSteps = 2;

  // Focus management
  const modalRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  // Validation function
  const validateField = (name: string, value: string): string => {
    if (!value.trim() && ['first_name', 'last_name', 'date_of_birth', 'phone', 'gender', 'address'].includes(name)) {
      return 'This field is required';
    }

    const pattern = validationPatterns[name as keyof typeof validationPatterns];
    if (pattern && value.trim() && !pattern.test(value.trim())) {
      return validationMessages[name as keyof typeof validationMessages];
    }

    // Special validation for date of birth
    if (name === 'date_of_birth' && value) {
      const dob = new Date(value);
      const today = new Date();
      if (dob > today) {
        return 'Date of birth cannot be in the future';
      }
    }

    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for phone number inputs - only allow digits
    if (name === 'phone' || name === 'emergency_contact') {
      const numericValue = value.replace(/\D/g, ''); // Remove all non-digits
      if (numericValue.length <= 10) { // Limit to 10 digits
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // If field has been touched and has a previous error, validate on change
    if (touchedFields.has(name)) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error || '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Only validate if user has entered something and then removed it
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
    
    // Only submit if we're on the final step
    if (currentStep < totalSteps) {
      return;
    }
    
    // Validate required fields only
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach(key => {
      // Only validate required fields
      if (['first_name', 'last_name', 'date_of_birth', 'gender', 'phone', 'address'].includes(key)) {
        const error = validateField(key, formData[key as keyof typeof formData]);
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

    // Prepare form data with defaults for empty fields
    const submitData = {
      ...formData,
      allergies: formData.allergies.trim() || 'None',
    };

    setLoading(true);
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Patient added successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to add patient');
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      toast.error('An unexpected error occurred');
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
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        newErrors[field] = error;
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

  // Removed unused handleFormKeyDown function

  const handleOverlayKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  };

  const canProceed = () => {
    const currentStepFields = getCurrentStepFields();
    const requiredFields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'phone', 'address'];
    
    return currentStepFields.every(field => {
      // For second step (medical information), all fields are optional
      if (currentStep === 2) {
        // Just check if there are no validation errors for filled fields
        return !errors[field];
      }
      
      // For first step, check required fields
      if (requiredFields.includes(field)) {
        const value = formData[field as keyof typeof formData];
        const hasValue = field === 'gender' || (value && value.trim() !== '');
        const hasNoError = !errors[field];
        return hasValue && hasNoError;
      }
      
      // Optional fields in first step
      return true;
    });
  };

  const getCurrentStepFields = () => {
    switch (currentStep) {
      case 1:
        return ['first_name', 'last_name', 'date_of_birth', 'gender', 'phone', 'address'];
      case 2:
        return ['blood_group', 'allergies', 'emergency_contact'];
      default:
        return [];
    }
  };

  const renderInput = (label: string, name: string, type = 'text', required = false, placeholder = '') => (
    <div>
      <label htmlFor={name} className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        value={formData[name as keyof typeof formData] || ''}
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Basic Information</h3>
              <p className="text-xs sm:text-sm text-gray-600">Patient&apos;s personal details</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderInput("First Name", "first_name", "text", true, "e.g., Rahul")}
              {renderInput("Last Name", "last_name", "text", true, "e.g., Sharma")}
              {renderInput("Date of Birth", "date_of_birth", "date", true)}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
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

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Medical Information</h3>
              <p className="text-xs sm:text-sm text-gray-600">Additional medical details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="blood_group" className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Group
                </label>
                <select
                  id="blood_group"
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-sm"
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
                <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-2">
                  Known Allergies
                </label>
                <textarea
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="List any known allergies (Leave empty if none)"
                />
              </div>
              {renderInput("Emergency Contact", "emergency_contact", "tel", false, "e.g., 8765432109")}
            </div>
          </div>
        );

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
                <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-gray-800">Add New Patient</h2>
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
                <span>Basic Information</span>
                <span>Medical Details</span>
              </div>
              <div className="sm:hidden text-center text-xs text-gray-500 mb-2">
                Step {currentStep} of {totalSteps}: {currentStep === 1 ? 'Basic Information' : 'Medical Details'}
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
                {renderStepContent()}
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
                      'Add Patient'
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
