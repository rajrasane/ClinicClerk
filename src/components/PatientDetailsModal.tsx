'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Copy } from 'lucide-react';
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
  created_at: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface Patient {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  phone: string;
  address: string;
  blood_group: string;
  allergies: string;
  emergency_contact: string;
  created_at: string;
  updated_at: string;
  visit_count?: number;
}

interface PatientDetailsModalProps {
  patient: Patient;
  onClose: () => void;
  onUpdate: () => void;
  onAddVisit?: (patientId: number) => void;
  onViewVisit?: (visit: Visit) => void;
}

export default function PatientDetailsModal({ patient, onClose, onAddVisit, onViewVisit }: PatientDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [mounted, setMounted] = useState(false);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [visitsLoaded, setVisitsLoaded] = useState(false);
  
  // Touch/swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      setMounted(false);
      // Restore background scrolling when modal closes
      document.body.style.overflow = 'unset';
    };
  }, []);

  const loadVisits = async () => {
    if (visitsLoaded || visitsLoading || typeof window === 'undefined') return;
    
    // Skip API call if we know there are no visits
    const visitCount = Number(patient.visit_count);
    if (visitCount === 0) {
      setVisits([]);
      setVisitsLoaded(true);
      return;
    }
    
    setVisitsLoading(true);
    try {
      // Use cached fetch for visit history
      const { cachedFetch } = await import('@/lib/cache');
      const data = await cachedFetch(`/api/visits?patient_id=${patient.id}`, undefined, 5); // 5 min cache
      
      if (data.success && data.data) {
        setVisits(data.data);
        setVisitsLoaded(true);
      }
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setVisitsLoading(false);
    }
  };

  const handleVisitsTab = () => {
    setActiveTab('visits');
    // Only load visits if we haven't loaded them AND there are visits to load
    if (!visitsLoaded && Number(patient.visit_count) > 0) {
      loadVisits();
    }
  };

  // Swipe detection
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeTab === 'details') {
      // Swipe left: details -> visits
      handleVisitsTab();
    } else if (isRightSwipe && activeTab === 'visits') {
      // Swipe right: visits -> details
      setActiveTab('details');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Phone number copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy phone number');
    }
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
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{patient.first_name} {patient.last_name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {patient.age} years • {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
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
              onClick={handleVisitsTab}
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
          <AnimatePresence mode="wait">
            {activeTab === 'details' && (
              <motion.div
                key="details"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 10, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">{patient.first_name} {patient.middle_name ? `${patient.middle_name} ` : ''}{patient.last_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {patient.age} years old
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Recorded on {formatDate(patient.created_at)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    patient.gender === 'M' ? 'bg-blue-100 text-blue-800' : 
                    patient.gender === 'F' ? 'bg-pink-100 text-pink-800' : 
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                  </span>
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
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-900">{patient.phone}</p>
                    <button
                      onClick={() => copyToClipboard(patient.phone)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title="Copy phone number"
                    >
                      <Copy className="h-3 w-3" />
                      <span>copy</span>
                    </button>
                  </div>
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
                  <p className="mt-1 text-sm text-gray-900">{patient.allergies || 'None'}</p>
                </div>
              </div>
              </motion.div>
            )}

            {activeTab === 'visits' && (
              <motion.div
                key="visits"
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -10, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="space-y-4"
              >
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

              {visitsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : visits && visits.length > 0 ? (
                <div className="space-y-4">
                  {visits.map((visit, index) => (
                    <div key={visit.id}>
                      {index > 0 && <hr className="sm:hidden border-gray-300 my-3" />}
                      <div className="border rounded-lg p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 transition-colors relative group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0 pr-3">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {visit.chief_complaint}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            {formatDate(visit.visit_date)}
                          </p>
                        </div>
                        {onViewVisit && (
                          <button
                            onClick={() => {
                              onClose(); // Close patient details modal first
                              onViewVisit(visit); // Open visit details modal
                            }}
                            className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border-2 border-blue-200 hover:border-blue-600"
                            title="View visit details"
                            aria-label="View visit details"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 transform hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Vitals Section */}
                      {visit.vitals && (
                        <div className="mb-3">
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
                            {/* O2 Saturation */}
                            {visit.vitals.o2 && (
                              <div className="flex items-center whitespace-nowrap">
                                <span className="w-11 sm:w-auto font-medium">O2</span>
                                <span className="mx-1">:</span>
                                <span>{String(visit.vitals.o2).includes('%') ? visit.vitals.o2 : `${visit.vitals.o2}%`}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">🏥</div>
                  <p className="text-gray-500">No visits recorded yet</p>
                  <button 
                    onClick={() => {
                      if (onAddVisit) {
                        onClose();
                        onAddVisit(patient.id);
                      }
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Record first visit
                  </button>
                </div>
              )}
              </motion.div>
            )}
          </AnimatePresence>
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
