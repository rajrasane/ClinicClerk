'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface Visit {
  id: number;
  visit_date: string;
  chief_complaint: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  vitals: Record<string, string> | null;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  address: string;
  blood_group?: string;
  allergies: string;
  emergency_contact?: string;
  created_at: string;
  updated_at: string;
  visits?: Visit[];
  visit_count?: number;
}

interface PatientDetailsModalProps {
  patient: Patient;
  onClose: () => void;
  onUpdate: () => void;
  onAddVisit?: (patientId: number) => void;
}

export default function PatientDetailsModal({ patient, onClose, onAddVisit }: PatientDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-[99999] p-4"
        style={{ zIndex: 99999 }}
        onClick={onClose}
      >
        <motion.div
          key="modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{patient.first_name} {patient.last_name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {calculateAge(patient.date_of_birth)} years • {patient.gender} • {patient.blood_group || 'Blood group not recorded'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex sm:space-x-8 sm:px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex-1 sm:flex-none text-center ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Patient Details
            </button>
            <button
              onClick={() => setActiveTab('visits')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex-1 sm:flex-none text-center ${
                activeTab === 'visits'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Visit History ({patient.visit_count || 0})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">{patient.first_name} {patient.last_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(patient.date_of_birth)} ({calculateAge(patient.date_of_birth)} years old)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <p className="mt-1 text-sm text-gray-900">{patient.gender}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {patient.blood_group || '--'}
                  </span>
                </div>
              </div>

              <hr className="md:hidden border-gray-200" />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{patient.phone}</p>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{patient.address || 'Not provided'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                  <p className="mt-1 text-sm text-gray-900">{patient.emergency_contact || '--'}</p>
                </div>
              </div>

              <hr className="md:col-span-2 border-gray-200" />

              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Allergies</label>
                  <p className="mt-1 text-sm text-gray-900">{patient.allergies || 'None reported'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'visits' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Visit History</h3>
                <button
                  onClick={() => {
                    if (onAddVisit) {
                      onClose(); // Close patient details modal first
                      onAddVisit(patient.id); // Then open add visit modal with patient pre-selected
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add New Visit
                </button>
              </div>

              {patient.visits && patient.visits.length > 0 ? (
                <div className="space-y-4">
                  {patient.visits.map((visit) => (
                    <div key={visit.id} className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                      <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                            {visit.chief_complaint.length > 40 ? `${visit.chief_complaint.substring(0, 40)}...` : visit.chief_complaint}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {formatDate(visit.visit_date)} • Visit #{visit.id}
                          </p>
                        </div>
                        {visit.vitals && (
                          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-start gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600 bg-white/50 sm:bg-transparent p-2.5 sm:p-0 rounded-lg sm:rounded-none">
                            {/* Temperature with unit */}
                            {visit.vitals.temperature && (
                              <div className="flex items-center whitespace-nowrap">
                                <span className="w-11 sm:w-auto font-medium">Temp</span>
                                <span className="mx-1">:</span>
                                <span>{String(visit.vitals.temperature).includes('°F') ? visit.vitals.temperature : `${visit.vitals.temperature}°F`}</span>
                              </div>
                            )}
                            {/* Pulse */}
                            {visit.vitals.pulse && (
                              <div className="flex items-center whitespace-nowrap">
                                <span className="w-11 sm:w-auto font-medium">Pulse</span>
                                <span className="mx-1">:</span>
                                <span>{String(visit.vitals.pulse).toLowerCase().includes('bpm') ? visit.vitals.pulse : `${visit.vitals.pulse} bpm`}</span>
                              </div>
                            )}
                            {/* Blood Pressure */}
                            {visit.vitals.bp && (
                              <div className="flex items-center whitespace-nowrap">
                                <span className="w-11 sm:w-auto font-medium">BP</span>
                                <span className="mx-1">:</span>
                                <span>{visit.vitals.bp}</span>
                              </div>
                            )}
                            {/* Weight with unit */}
                            {visit.vitals.weight && (
                              <div className="flex items-center whitespace-nowrap">
                                <span className="w-11 sm:w-auto font-medium">Wt</span>
                                <span className="mx-1">:</span>
                                <span>{String(visit.vitals.weight).toLowerCase().includes('kg') ? visit.vitals.weight : `${visit.vitals.weight} kg`}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm">
                        <div className="bg-white rounded-md p-2 sm:p-3">
                          <span className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Chief Complaint:</span>
                          <p className="text-xs sm:text-sm text-gray-900">{visit.chief_complaint}</p>
                        </div>
                        
                        {visit.symptoms && (
                          <div className="bg-white rounded-md p-2 sm:p-3">
                            <span className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Symptoms:</span>
                            <p className="text-xs sm:text-sm text-gray-900">{visit.symptoms}</p>
                          </div>
                        )}
                        
                        {visit.diagnosis && (
                          <div className="bg-white rounded-md p-2 sm:p-3">
                            <span className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Diagnosis:</span>
                            <p className="text-xs sm:text-sm text-gray-900">{visit.diagnosis}</p>
                          </div>
                        )}
                        
                        {visit.prescription && (
                          <div className="bg-white rounded-md p-2 sm:p-3">
                            <span className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Prescription:</span>
                            <p className="text-xs sm:text-sm text-gray-900 whitespace-pre-wrap">{visit.prescription}</p>
                          </div>
                        )}
                      </div>

                      {visit.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="font-medium text-gray-700">Notes:</span>
                          <p className="text-sm text-gray-900">{visit.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">🏥</div>
                  <p className="text-gray-500">No visits recorded yet</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                    Record first visit
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-2 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
