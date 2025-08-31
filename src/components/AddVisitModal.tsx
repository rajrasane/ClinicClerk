'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
      blood_pressure: '',
      pulse: '',
      weight: '',
      height: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Focus management
  const modalRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  useEffect(() => {
    fetchPatients();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare vitals data
      const vitalsData = Object.entries(formData.vitals)
        .filter(([key, value]) => value.trim() !== '')
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as any);

      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          patient_id: parseInt(formData.patient_id),
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
        setError(result.error || 'Failed to create visit');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
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
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const handleOverlayKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
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
          className="bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-4xl h-[90vh] sm:h-[85vh] lg:h-[94vh] flex flex-col overflow-hidden"
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
                <p className="text-gray-600 text-xs sm:text-sm mt-0.5 sm:mt-1">Record patient visit details</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl p-1"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {/* Content */}
            <div className="flex-1 min-h-0 relative">
              <div className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent p-3 sm:p-4 md:p-5">
                <form id="visit-form" onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50/50 backdrop-blur-sm border border-red-200 text-red-700 rounded-lg">
                      {error}
                    </div>
                  )}

                  {/* Patient Selection */}
                  <div className="space-y-6">
                    <div className="text-center mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Patient Information</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Select patient and visit details</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Select Patient <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Search patient by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                          />
                          <select
                            name="patient_id"
                            value={formData.patient_id}
                            onChange={handleChange}
                            required
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                          >
                            <option value="">Choose a patient</option>
                            {filteredPatients.map((patient) => (
                              <option key={patient.id} value={patient.id}>
                                {patient.first_name} {patient.last_name} - {patient.phone}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Visit Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="visit_date"
                          value={formData.visit_date}
                          onChange={handleChange}
                          required
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Follow-up Date <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                          type="date"
                          name="follow_up_date"
                          value={formData.follow_up_date}
                          onChange={handleChange}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visit Details */}
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
                          required
                          rows={2}
                          placeholder="Main reason for visit"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                        />
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

                  {/* Vitals */}
                  <div className="space-y-6">
                    <div className="text-center mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Vital Signs</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Patient vital measurements (optional)</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Temperature</label>
                        <input
                          type="text"
                          name="vitals.temperature"
                          value={formData.vitals.temperature}
                          onChange={handleChange}
                          placeholder="e.g., 98.6°F"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Blood Pressure</label>
                        <input
                          type="text"
                          name="vitals.blood_pressure"
                          value={formData.vitals.blood_pressure}
                          onChange={handleChange}
                          placeholder="e.g., 120/80"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Pulse Rate</label>
                        <input
                          type="text"
                          name="vitals.pulse"
                          value={formData.vitals.pulse}
                          onChange={handleChange}
                          placeholder="e.g., 72 bpm"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Weight</label>
                        <input
                          type="text"
                          name="vitals.weight"
                          value={formData.vitals.weight}
                          onChange={handleChange}
                          placeholder="e.g., 70 kg"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all border-gray-300 focus:ring-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-6">
                    <div className="text-center mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Additional Notes</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Any other observations or instructions</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div>
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

                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-2.5 sm:py-3 flex justify-end items-center border-t flex-shrink-0">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="visit-form"
                  disabled={loading}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
