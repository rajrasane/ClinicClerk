'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiCache } from '@/lib/cache';
import { DatePicker } from '@/components/ui/date-picker';
import { supabase } from '@/lib/supabase';

// Helper function to format date without timezone issues
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface Visit {
  id: number;
  patient_id: number;
  visit_date: string;
  chief_complaint: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  follow_up_date: string;
  vitals: Record<string, string> | null;
  first_name: string;
  last_name: string;
  phone: string;
  age: number;
  gender: string;
  // Payment fields - nullable for existing visits
  consultation_fee: number | null;
  payment_status: 'P' | 'D' | null;
  payment_method: 'C' | 'O' | null;
}

interface EditVisitModalProps {
  visit: Visit;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditVisitModal({ visit, onClose, onSuccess }: EditVisitModalProps) {
  // Format date to YYYY-MM-DD for date input, handling timezone correctly

  const [formData, setFormData] = useState({
    visit_date: visit.visit_date ? new Date(visit.visit_date) : new Date(),
    chief_complaint: visit.chief_complaint || '',
    symptoms: visit.symptoms || '',
    diagnosis: visit.diagnosis || '',
    prescription: visit.prescription || '',
    notes: visit.notes || '',
    follow_up_date: visit.follow_up_date ? new Date(visit.follow_up_date) : undefined,
    vitals: {
      temperature: visit?.vitals?.temperature || '',
      bp: visit?.vitals?.bp || '',
      pulse: visit?.vitals?.pulse || '',
      weight: visit?.vitals?.weight || '',
      o2: visit?.vitals?.o2 || ''
    },
    // Payment fields
    consultation_fee: visit.consultation_fee || 0,
    payment_status: visit.payment_status || 'D',
    payment_method: visit.payment_method || 'C'
  });

  const originalData = {
    visit_date: visit.visit_date ? new Date(visit.visit_date) : new Date(),
    chief_complaint: visit.chief_complaint || '',
    symptoms: visit.symptoms || '',
    diagnosis: visit.diagnosis || '',
    prescription: visit.prescription || '',
    notes: visit.notes || '',
    follow_up_date: visit.follow_up_date ? new Date(visit.follow_up_date) : undefined,
    vitals: {
      temperature: visit?.vitals?.temperature || '',
      bp: visit?.vitals?.bp || '',
      pulse: visit?.vitals?.pulse || '',
      weight: visit?.vitals?.weight || '',
      o2: visit?.vitals?.o2 || ''
    },
    // Payment fields
    consultation_fee: visit.consultation_fee || 0,
    payment_status: visit.payment_status || 'D',
    payment_method: visit.payment_method || 'C'
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Restore background scrolling when modal closes
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Check if form data has changed
  const hasChanges = () => {
    // Compare dates separately since Date objects need special handling
    const formDateStr = formData.visit_date ? formatDateForAPI(formData.visit_date) : '';
    const originalDateStr = originalData.visit_date ? formatDateForAPI(originalData.visit_date) : '';
    const formFollowUpStr = formData.follow_up_date ? formatDateForAPI(formData.follow_up_date) : '';
    const originalFollowUpStr = originalData.follow_up_date ? formatDateForAPI(originalData.follow_up_date) : '';
    
    const changes = {
      dateChanged: formDateStr !== originalDateStr,
      followUpChanged: formFollowUpStr !== originalFollowUpStr,
      complaintChanged: formData.chief_complaint !== originalData.chief_complaint,
      symptomsChanged: formData.symptoms !== originalData.symptoms,
      diagnosisChanged: formData.diagnosis !== originalData.diagnosis,
      prescriptionChanged: formData.prescription !== originalData.prescription,
      notesChanged: formData.notes !== originalData.notes,
      vitalsChanged: JSON.stringify(formData.vitals) !== JSON.stringify(originalData.vitals),
      feeChanged: formData.consultation_fee !== originalData.consultation_fee,
      statusChanged: formData.payment_status !== originalData.payment_status,
      methodChanged: formData.payment_status === 'P' && formData.payment_method !== originalData.payment_method
    };
    
    console.log('Change detection:', changes);
    console.log('Form data:', formData);
    console.log('Original data:', originalData);
    
    return Object.values(changes).some(changed => changed);
  };


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.visit_date) {
      newErrors.visit_date = 'Visit date is required';
    }

    if (!formData.chief_complaint.trim()) {
      newErrors.chief_complaint = 'Chief complaint is required';
    }

    // Payment validation
    if (formData.consultation_fee < 0) {
      newErrors.consultation_fee = 'Consultation fee cannot be negative';
    }

    // Remove this validation - payment method can have a default value when status is Due

    if (formData.payment_status === 'P' && !formData.payment_method) {
      newErrors.payment_method = 'Payment method is required when payment is marked as paid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [name]: date }));
    
    // Clear error when date is selected
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted, validating...');

    if (!validateForm()) {
      console.log('Validation failed:', errors);
      return;
    }

    console.log('Validation passed, submitting...');
    setLoading(true);

    try {
      // Prepare vitals data - only include non-empty values
      const vitalsData = Object.entries(formData.vitals)
        .filter(([, value]) => value.trim() !== '')
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);

      const submitData = {
        visit_date: formatDateForAPI(formData.visit_date),
        chief_complaint: formData.chief_complaint,
        symptoms: formData.symptoms,
        diagnosis: formData.diagnosis,
        prescription: formData.prescription,
        notes: formData.notes,
        follow_up_date: formData.follow_up_date ? formatDateForAPI(formData.follow_up_date) : null,
        vitals: Object.keys(vitalsData).length > 0 ? vitalsData : null,
        // Payment fields
        consultation_fee: formData.consultation_fee,
        payment_status: formData.payment_status,
        payment_method: formData.payment_status === 'P' ? formData.payment_method : null
      };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/visits/${visit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Visit updated successfully!');
        // Clear cache for both patients and visits
        apiCache.invalidate('/api/patients');
        apiCache.invalidate('/api/visits');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to update visit');
        setErrors({ general: result.error || 'Failed to update visit' });
      }
    } catch (error) {
      console.error('Error updating visit:', error);
      toast.error('Failed to update visit. Please try again.');
      setErrors({ general: 'Failed to update visit. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('vitals.')) {
      const vitalName = name.split('.')[1];
      
      // Handle different vitals input restrictions
      let filteredValue = value;
      if (vitalName === 'bp') {
        // Allow only digits and forward slash for blood pressure
        filteredValue = value.replace(/[^0-9/]/g, '');
      } else {
        // For all other vitals, allow only digits and decimal point
        filteredValue = value.replace(/[^0-9.]/g, '');
      }
      
      setFormData({
        ...formData,
        vitals: {
          ...formData.vitals,
          [vitalName]: filteredValue
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Visit</h2>
            <p className="text-sm text-gray-600 mt-1">
              {visit.first_name} {visit.last_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <form id="edit-visit-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Visit Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Visit Date</label>
                  <DatePicker
                    date={formData.visit_date}
                    onDateChange={(date) => handleDateChange('visit_date', date)}
                    placeholder="Select visit date"
                    error={!!errors.visit_date}
                    className={errors.visit_date ? 'border-red-500' : ''}
                  />
                  {errors.visit_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.visit_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Chief Complaint</label>
                  <textarea
                    name="chief_complaint"
                    value={formData.chief_complaint}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Fever and headache for 2 days"
                  />
                  {errors.chief_complaint && (
                    <p className="mt-1 text-sm text-red-600">{errors.chief_complaint}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Symptoms</label>
                  <textarea
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Detailed symptoms description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
                  <DatePicker
                    date={formData.follow_up_date}
                    onDateChange={(date) => handleDateChange('follow_up_date', date)}
                    placeholder="Select follow-up date (optional)"
                  />
                </div>
              </div>

              <hr className="md:hidden border-gray-200" />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Clinical Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
                  <textarea
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Clinical diagnosis"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Prescription</label>
                  <textarea
                    name="prescription"
                    value={formData.prescription}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter prescription details (e.g., Paracetamol 500mg, Amoxicillin 250mg)"
                  />
                </div>
              </div>

              <hr className="md:col-span-2 border-gray-200/50" />

              {/* Payment Information Section */}
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-base font-semibold text-gray-900">Payment Information</h3>
                
                <div className={`grid gap-4 ${formData.payment_status === 'D' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Consultation Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                      <input
                        type="number"
                        name="consultation_fee"
                        value={formData.consultation_fee}
                        onChange={handleInputChange}
                        min="0"
                        max="99999"
                        placeholder="Enter amount"
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {errors.consultation_fee && (
                      <p className="mt-1 text-sm text-red-600">{errors.consultation_fee}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Status
                    </label>
                    <select
                      name="payment_status"
                      value={formData.payment_status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="P">Paid</option>
                      <option value="D">Due</option>
                      <option value="">None</option>
                    </select>
                  </div>
                  {formData.payment_status === 'P' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="C">Cash</option>
                        <option value="O">Online</option>
                      </select>
                      {errors.payment_method && (
                        <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <hr className="md:col-span-2 border-gray-200/50" />

              <div className="md:col-span-2 space-y-3">
                <h3 className="text-base font-semibold text-gray-900">Vitals</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Temperature</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      name="vitals.temperature"
                      value={formData.vitals.temperature}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 98.6°F"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Blood Pressure</label>
                    <input
                      type="text"
                      name="vitals.bp"
                      value={formData.vitals.bp}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 120/80"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pulse</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="vitals.pulse"
                      value={formData.vitals.pulse}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 72 bpm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Weight</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      name="vitals.weight"
                      value={formData.vitals.weight}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 70 kg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">O2 Saturation</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="vitals.o2"
                      value={formData.vitals.o2}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 98%"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-3 border-t border-gray-200/50 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-visit-form"
            disabled={loading || !hasChanges()}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            onClick={(e) => {
              console.log('Button clicked!');
              console.log('Loading:', loading);
              console.log('Has changes:', hasChanges());
              console.log('Button disabled:', loading || !hasChanges());
              handleSubmit(e);
            }}
          >
            {loading ? 'Updating...' : 'Update Visit'}
          </button>
        </div>
      </div>
    </div>
  );
}