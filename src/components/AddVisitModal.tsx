'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface AddVisitModalProps {
  patientId?: number;
  preselectedPatientId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddVisitModal({ patientId, preselectedPatientId, onClose, onSuccess }: AddVisitModalProps) {
  const [formData, setFormData] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    chief_complaint: '',
    symptoms: '',
    diagnosis: '',
    prescription: '',
    notes: '',
    follow_up_date: '',
    vitals: {
      temperature: '',
      blood_pressure: '',
      pulse: '',
      weight: ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('vitals.')) {
      const vitalKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vitals: { ...prev.vitals, [vitalKey]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.chief_complaint.trim()) {
      newErrors.chief_complaint = 'Chief complaint is required';
    }

    if (formData.visit_date && new Date(formData.visit_date) > new Date()) {
      newErrors.visit_date = 'Visit date cannot be in the future';
    }

    if (formData.follow_up_date && new Date(formData.follow_up_date) < new Date()) {
      newErrors.follow_up_date = 'Follow-up date cannot be in the past';
    }

    // Validate vitals
    if (formData.vitals.temperature) {
      const temp = parseFloat(formData.vitals.temperature);
      if (isNaN(temp) || temp < 30 || temp > 45) {
        newErrors['vitals.temperature'] = 'Please enter a valid temperature (30-45°C)';
      }
    }

    if (formData.vitals.blood_pressure && !/^\d{1,3}\/\d{1,3}$/.test(formData.vitals.blood_pressure)) {
      newErrors['vitals.blood_pressure'] = 'Please enter blood pressure in format "120/80"';
    }

    if (formData.vitals.pulse) {
      const pulse = parseInt(formData.vitals.pulse);
      if (isNaN(pulse) || pulse < 30 || pulse > 200) {
        newErrors['vitals.pulse'] = 'Please enter a valid pulse rate (30-200)';
      }
    }

    if (formData.vitals.weight) {
      const weight = parseFloat(formData.vitals.weight);
      if (isNaN(weight) || weight < 1 || weight > 300) {
        newErrors['vitals.weight'] = 'Please enter a valid weight (1-300 kg)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentPatientId = preselectedPatientId || patientId;
    if (!currentPatientId) {
      toast.error('No patient selected');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        patient_id: preselectedPatientId || patientId,
        visit_date: formData.visit_date || new Date().toISOString().split('T')[0],
        chief_complaint: formData.chief_complaint.trim(),
        symptoms: formData.symptoms.trim() || null,
        diagnosis: formData.diagnosis.trim() || null,
        prescription: formData.prescription.trim() || null,
        notes: formData.notes.trim() || null,
        follow_up_date: formData.follow_up_date || null,
        vitals: {
          temperature: formData.vitals.temperature || null,
          blood_pressure: formData.vitals.blood_pressure || null,
          pulse: formData.vitals.pulse || null,
          weight: formData.vitals.weight || null
        }
      };

      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Visit added successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to add visit');
        setErrors({ general: result.error || 'Failed to add visit' });
      }
    } catch (error) {
      console.error('Error adding visit:', error);
      toast.error('Failed to add visit. Please try again.');
      setErrors({ general: 'Failed to add visit. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add New Visit</h2>
            <p className="text-sm text-gray-600 mt-1">Enter visit details</p>
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

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Visit Information</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Visit Date</label>
                  <input
                    type="date"
                    name="visit_date"
                    value={formData.visit_date}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Persistent cough and fever"
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
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Sore throat, fatigue, body aches"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
                  <textarea
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Upper respiratory infection"
                  />
                </div>
              </div>

              <hr className="md:hidden border-gray-200" />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Additional Details</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Prescription</label>
                  <textarea
                    name="prescription"
                    value={formData.prescription}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Amoxicillin 500mg, 3 times daily for 7 days"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Patient advised to stay hydrated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
                  <input
                    type="date"
                    name="follow_up_date"
                    value={formData.follow_up_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.follow_up_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.follow_up_date}</p>
                  )}
                </div>
              </div>

              <hr className="md:col-span-2 border-gray-200" />

              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Vitals</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Temperature (°C)</label>
                    <input
                      type="number"
                      name="vitals.temperature"
                      value={formData.vitals.temperature}
                      onChange={handleChange}
                      step="0.1"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 37.5"
                    />
                    {errors['vitals.temperature'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['vitals.temperature']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Blood Pressure (mmHg)</label>
                    <input
                      type="text"
                      name="vitals.blood_pressure"
                      value={formData.vitals.blood_pressure}
                      onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 120/80"
                    />
                    {errors['vitals.blood_pressure'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['vitals.blood_pressure']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pulse (bpm)</label>
                    <input
                      type="number"
                      name="vitals.pulse"
                      value={formData.vitals.pulse}
                      onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 80"
                    />
                    {errors['vitals.pulse'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['vitals.pulse']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                    <input
                      type="number"
                      name="vitals.weight"
                      value={formData.vitals.weight}
                      onChange={handleChange}
                      step="0.1"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 70.5"
                    />
                    {errors['vitals.weight'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['vitals.weight']}</p>
                    )}
                  </div>
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
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            onClick={handleSubmit}
          >
            {loading ? 'Adding...' : 'Add Visit'}
          </button>
        </div>
      </div>
    </div>
  );
}