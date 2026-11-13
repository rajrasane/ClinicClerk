'use client';

import { useModalFocus } from '@/hooks/useModalFocus';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { Patient } from '@/types';
import { GENDER_DISPLAY_TO_DB, GENDER_DB_TO_DISPLAY } from '@/types';

interface EditPatientModalProps {
  patient: Patient;
  onClose: () => void;
  onSuccess: () => void;
}


export default function EditPatientModal({ patient, onClose, onSuccess }: EditPatientModalProps) {
  const modalRef = useModalFocus(onClose);
  // Initialize form data directly from patient prop to prevent flicker
  const getInitialData = () => ({
    first_name: patient.first_name || '',
    middle_name: patient.middle_name || '',
    last_name: patient.last_name || '',
    age: patient.age?.toString() || '',
    gender: GENDER_DB_TO_DISPLAY[patient.gender] || patient.gender || '',
    phone: patient.phone || '',
    address: patient.address || '',
    blood_group: patient.blood_group || '',
    allergies: patient.allergies || '',
    emergency_contact: patient.emergency_contact || ''
  });

  const [formData, setFormData] = useState(getInitialData);
  const [originalData] = useState(getInitialData);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Check if form data has changed
  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Special handling for phone number inputs - only allow digits
    if (name === 'phone' || name === 'emergency_contact') {
      const numericValue = value.replace(/\D/g, ''); // Remove all non-digits
      if (numericValue.length <= 10) { // Limit to 10 digits
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      }
    } else if (name === 'age') {
      // Special handling for age - only allow digits, max 3 digits, max value 120
      const numericValue = value.replace(/\D/g, ''); // Remove all non-digits
      const ageNumber = parseInt(numericValue);
      if (numericValue === '' || (numericValue.length <= 3 && ageNumber <= 120)) {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else {
      const age = parseInt(formData.age);
      if (isNaN(age) || age <= 0 || age > 120) {
        newErrors.age = 'Please enter a valid age (1-120)';
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare form data with null for empty values
      const submitData = {
        ...formData,
        age: parseInt(formData.age),
        gender: GENDER_DISPLAY_TO_DB[formData.gender as keyof typeof GENDER_DISPLAY_TO_DB] || formData.gender,
        middle_name: formData.middle_name.trim() || null,
        blood_group: formData.blood_group.trim() || null,
        allergies: formData.allergies.trim() || 'None',
        emergency_contact: formData.emergency_contact.trim() || null
      };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Patient updated successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to update patient');
        setErrors({ general: result.error || 'Failed to update patient' });
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Failed to update patient. Please try again.');
      setErrors({ general: 'Failed to update patient. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-99999 p-4">
      <div ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-patient-title"
          tabIndex={-1}
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center gap-3 p-4 sm:p-6 border-b">
          <div>
            <h2 id="edit-patient-title" className="text-2xl font-bold text-gray-900">Edit Patient</h2>
            <p className="text-sm text-gray-600 mt-1">Update patient information</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="h-11 w-11 shrink-0 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain max-h-[60vh]">
          {errors.general && (
            <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>

                <div>
                  <label htmlFor="edit-patient-first_name" className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    id="edit-patient-first_name"
                    aria-invalid={!!errors.first_name}
                    aria-describedby={errors.first_name ? "edit-patient-first_name-error" : undefined}
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    autoComplete="given-name"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Rahul"
                  />
                  {errors.first_name && (
                    <p id="edit-patient-first_name-error" className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="edit-patient-middle_name" className="block text-sm font-medium text-gray-700">Middle Name</label>
                  <input
                    type="text"
                    id="edit-patient-middle_name"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleChange}
                    autoComplete="additional-name"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Kumar (optional)"
                  />
                </div>

                <div>
                  <label htmlFor="edit-patient-last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    id="edit-patient-last_name"
                    aria-invalid={!!errors.last_name}
                    aria-describedby={errors.last_name ? "edit-patient-last_name-error" : undefined}
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    autoComplete="family-name"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Sharma"
                  />
                  {errors.last_name && (
                    <p id="edit-patient-last_name-error" className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="edit-patient-age" className="block text-sm font-medium text-gray-700">Age</label>
                  <input
                    type="number"
                    id="edit-patient-age"
                    aria-invalid={!!errors.age}
                    aria-describedby={errors.age ? "edit-patient-age-error" : undefined}
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    autoComplete="off"
                    min="1"
                    max="120"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 35"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Current age as reported by patient
                  </p>
                  {errors.age && (
                    <p id="edit-patient-age-error" className="mt-1 text-sm text-red-600">{errors.age}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="edit-patient-gender" className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    id="edit-patient-gender"
                    aria-invalid={!!errors.gender}
                    aria-describedby={errors.gender ? "edit-patient-gender-error" : undefined}
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    autoComplete="sex"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p id="edit-patient-gender-error" className="mt-1 text-sm text-red-600">{errors.gender}</p>
                  )}
                </div>
              </div>

              <hr className="md:hidden border-gray-200" />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>

                <div>
                  <label htmlFor="edit-patient-phone" className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    id="edit-patient-phone"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "edit-patient-phone-error" : undefined}
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 9876543210"
                  />
                  {errors.phone && (
                    <p id="edit-patient-phone-error" className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="edit-patient-address" className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    id="edit-patient-address"
                    aria-invalid={!!errors.address}
                    aria-describedby={errors.address ? "edit-patient-address-error" : undefined}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    autoComplete="street-address"
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Flat 203, Krishna Heights, Sector 12, Vashi, Navi Mumbai - 400703"
                  />
                  {errors.address && (
                    <p id="edit-patient-address-error" className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="edit-patient-emergency_contact" className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                  <input
                    type="tel"
                    id="edit-patient-emergency_contact"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    autoComplete="tel"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 9876543211"
                  />
                </div>
              </div>

              <hr className="md:col-span-2 border-gray-200" />

              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>

                <div>
                  <label htmlFor="edit-patient-blood_group" className="block text-sm font-medium text-gray-700">Blood Group</label>
                  <select
                    id="edit-patient-blood_group"
                    name="blood_group"
                    value={formData.blood_group || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? '' : e.target.value;
                      setFormData(prev => ({ ...prev, blood_group: value }));
                    }}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Not specified</option>
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

                <div>
                  <label htmlFor="edit-patient-allergies" className="block text-sm font-medium text-gray-700">Allergies</label>
                  <textarea
                    id="edit-patient-allergies"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Penicillin allergy, Dust allergy (or 'None' if no allergies)"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !hasChanges()}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            onClick={handleSubmit}
          >
            {loading ? 'Updating…' : 'Update Patient'}
          </button>
        </div>
      </div>
    </div>
  );
}