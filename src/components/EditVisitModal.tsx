'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

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
}

interface EditVisitModalProps {
  visit: Visit;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditVisitModal({ visit, onClose, onSuccess }: EditVisitModalProps) {
  // Format date to YYYY-MM-DD for date input, handling timezone correctly
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Adjust for timezone offset to prevent date shifting
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    visit_date: formatDateForInput(visit.visit_date),
    chief_complaint: visit.chief_complaint,
    symptoms: visit.symptoms || '',
    diagnosis: visit.diagnosis || '',
    prescription: visit.prescription || '',
    notes: visit.notes || '',
    follow_up_date: formatDateForInput(visit.follow_up_date),
    vitals: {
      temperature: visit.vitals?.temperature || '',
      bp: visit.vitals?.bp || '',
      pulse: visit.vitals?.pulse || '',
      weight: visit.vitals?.weight || '',
      height: visit.vitals?.height || ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.visit_date) {
      newErrors.visit_date = 'Visit date is required';
    }

    if (!formData.chief_complaint.trim()) {
      newErrors.chief_complaint = 'Chief complaint is required';
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
      const response = await fetch(`/api/visits/${visit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Visit updated successfully!');
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
      const vitalField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vitals: { ...prev.vitals, [vitalField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Visit</h2>
            <p className="text-sm text-gray-600 mt-1">
              {visit.first_name} {visit.last_name} • {new Date(visit.visit_date).toLocaleDateString()}
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
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Detailed symptoms description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
                  <input
                    type="date"
                    name="follow_up_date"
                    value={formData.follow_up_date}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Medications and dosage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Additional notes"
                  />
                </div>
              </div>

              <hr className="md:col-span-2 border-gray-200" />

              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Vitals</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Temperature</label>
                    <input
                      type="text"
                      name="vitals.temperature"
                      value={formData.vitals.temperature}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 120/80"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pulse</label>
                    <input
                      type="text"
                      name="vitals.pulse"
                      value={formData.vitals.pulse}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 72 bpm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Weight</label>
                    <input
                      type="text"
                      name="vitals.weight"
                      value={formData.vitals.weight}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 70 kg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Height</label>
                    <input
                      type="text"
                      name="vitals.height"
                      value={formData.vitals.height}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 175 cm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-2 border-t bg-gray-50">
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
            className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            onClick={handleSubmit}
          >
            {loading ? 'Updating...' : 'Update Visit'}
          </button>
        </div>
      </div>
    </div>
  );
}
