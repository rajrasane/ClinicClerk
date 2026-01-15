'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface Visit {
  id: number;
  patient_id: number;
  patient_name: string;
  age: number;
  gender: string;
  visit_date: string;
  chief_complaint: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  follow_up_date: string;
  vitals: Record<string, unknown> | undefined;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  phone: string;
  consultation_fee: number | null;
  payment_status: 'P' | 'D' | null;
  payment_method: 'C' | 'O' | null;
}

interface VisitDetailsModalProps {
  visit: Visit | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function VisitDetailsModal({ visit, onClose }: VisitDetailsModalProps) {
  const [mounted, setMounted] = useState(false);

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

  if (!mounted || !visit) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatVitals = (vitals: Record<string, unknown> | undefined) => {
    if (!vitals || typeof vitals !== 'object') return {};
    // Filter out empty values and return only non-empty vitals
    const filtered: Record<string, string> = {};
    Object.entries(vitals).forEach(([key, value]) => {
      if (value && value.toString().trim() !== '') {
        filtered[key] = value.toString();
      }
    });
    return filtered;
  };

  const formatPrescription = (prescription: string) => {
    if (!prescription || !prescription.trim()) return [];
    
    // Split by common separators and clean up
    const medications = prescription
      .split(/[,;\n]/)
      .map(med => med.trim())
      .filter(med => med.length > 0);
    
    return medications;
  };

  const renderContent = () => (
    <div className="p-6 overflow-y-auto max-h-[60vh]">
      <div className="space-y-6">
        {/* Visit Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Clinical Assessment</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Chief Complaint</label>
              <p className="mt-1 text-sm text-gray-900">{visit.chief_complaint || 'Not specified'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Symptoms</label>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                {visit.symptoms || 'No symptoms recorded'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {visit.diagnosis || 'No diagnosis recorded'}
              </span>
            </div>
          </div>
          
          <hr className="md:hidden border-gray-200" />
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Treatment Plan</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Prescription</label>
              {visit.prescription && visit.prescription.trim() ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formatPrescription(visit.prescription).map((medication, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200"
                    >
                      {medication}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-gray-500 italic">No prescription</p>
              )}
            </div>
            
            {visit.follow_up_date && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(visit.follow_up_date)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Vital Signs - Separate Section */}
        {Object.keys(visit.vitals || {}).length > 0 && (
          <div className="space-y-4">
            <hr className="border-gray-200 mt-4" />
            <h3 className="text-lg font-semibold text-gray-900">Vital Signs</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formatVitals(visit.vitals)).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 capitalize mb-1">
                    {key === 'bp' ? 'Blood Pressure' : key.replace(/_/g, ' ')}
                  </label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {key === 'temperature' ? 
                      (String(value).includes('°F') ? value : `${value}°F`) :
                      key === 'pulse' ? 
                      (String(value).toLowerCase().includes('bpm') ? value : `${value} bpm`) :
                      key === 'weight' ? 
                      (String(value).toLowerCase().includes('kg') ? value : `${value} kg`) :
                      key === 'o2' ? 
                      (String(value).includes('%') ? value : `${value}%`) :
                      key === 'bp' ? value :
                      String(value) || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {visit.notes && (
          <div className="md:col-span-2 space-y-4">
            <hr className="border-gray-200 mt-4" />
            <div>
              <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{visit.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-99999 p-4"
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
              <h2 className="text-2xl font-bold text-gray-900">{visit.first_name} {visit.last_name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-xs text-gray-600">
                  {formatDate(visit.visit_date)}
                </p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[0.7rem] font-medium ${
                  visit.payment_status === 'P' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : visit.payment_status === 'D' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {visit.consultation_fee !== null ? `₹${visit.consultation_fee}` : '—'} • {visit.payment_status === 'P' ? 'Paid' : visit.payment_status === 'D' ? 'Due' : '—'}{visit.payment_status === 'P' ? ` ${visit.payment_method === 'C' ? '(C)' : '(O)'}` : ''}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Main Content */}
          {renderContent()}

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
