'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

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
  vitals: any;
  created_at: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface VisitDetailsModalProps {
  visit: Visit | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function VisitDetailsModal({ visit, onClose, onUpdate }: VisitDetailsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !visit) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatVitals = (vitals: any) => {
    if (!vitals) return {};
    return vitals;
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
              <h2 className="text-2xl font-bold text-gray-900">Visit Details - #{visit.id}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {visit.first_name} {visit.last_name} • {formatDate(visit.visit_date)}
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
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            {/* Patient Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient Name</label>
                <p className="mt-1 text-sm text-gray-900">{visit.first_name} {visit.last_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                <p className="mt-1 text-sm text-gray-900">{visit.patient_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{visit.phone}</p>
              </div>
            </div>

            {/* Visit Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Visit Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(visit.visit_date)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(visit.follow_up_date)}</p>
                </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Chief Complaint</label>
                <p className="mt-1 text-sm text-gray-900 bg-blue-50 p-3 rounded-lg">{visit.chief_complaint}</p>
              </div>

              {visit.symptoms && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Symptoms</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{visit.symptoms}</p>
                </div>
              )}

              {visit.diagnosis && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
                  <p className="mt-1 text-sm text-gray-900 bg-green-50 p-3 rounded-lg">{visit.diagnosis}</p>
                </div>
              )}

              {visit.prescription && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Prescription</label>
                  <p className="mt-1 text-sm text-gray-900 bg-purple-50 p-3 rounded-lg whitespace-pre-wrap">{visit.prescription}</p>
                </div>
              )}

              {visit.notes && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-100 p-3 rounded-lg">{visit.notes}</p>
                </div>
              )}
            </div>

            {/* Vitals */}
            {visit.vitals && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Vital Signs</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(formatVitals(visit.vitals)).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded-lg text-center">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {key.replace('_', ' ')}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mt-1">
                        {value as string}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-2 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors text-xs"
          >
            Close
          </button>
          <button 
            onClick={onUpdate}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
          >
            Edit
          </button>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
