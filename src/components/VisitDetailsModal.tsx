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
  vitals: Record<string, string> | null;
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

export default function VisitDetailsModal({ visit, onClose }: VisitDetailsModalProps) {
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

  const formatVitals = (vitals: Record<string, string> | null) => {
    if (!vitals) return {};
    // Filter out empty values and return only non-empty vitals
    const filtered: Record<string, string> = {};
    Object.entries(vitals).forEach(([key, value]) => {
      if (value && value.toString().trim() !== '') {
        filtered[key] = value;
      }
    });
    return filtered;
  };

  const renderContent = () => (
    <div className="p-6 overflow-y-auto max-h-[60vh]">
      <div className="space-y-6">
        {/* Visit Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Section title="Chief Complaint">
              <p className="text-gray-800">{visit.chief_complaint || 'Not specified'}</p>
            </Section>
            
            <Section title="Symptoms">
              <p className="whitespace-pre-line text-gray-800">
                {visit.symptoms || 'No symptoms recorded'}
              </p>
            </Section>
          </div>
          
          <div className="space-y-4">
            <Section title="Diagnosis">
              <p className="whitespace-pre-line text-gray-800">
                {visit.diagnosis || 'No diagnosis recorded'}
              </p>
            </Section>
            
            <Section title="Prescription">
              <p className="whitespace-pre-line text-gray-800">
                {visit.prescription || 'No prescription'}
              </p>
            </Section>
          </div>
        </div>

        {/* Notes */}
        {visit.notes && (
          <Section title="Notes">
            <p className="whitespace-pre-line text-gray-800">{visit.notes}</p>
          </Section>
        )}

        {/* Vitals */}
        {Object.keys(visit.vitals || {}).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Vital Signs</h4>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(formatVitals(visit.vitals)).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-xs font-medium text-gray-500 capitalize mb-1">
                      {key === 'bp' ? 'Blood Pressure' : key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {String(value) || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Follow-up Date */}
        {visit.follow_up_date && (
          <Section title="Follow-up Date">
            <p className="text-gray-800">{formatDate(visit.follow_up_date)}</p>
          </Section>
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
              <h2 className="text-2xl font-bold text-gray-900">Visit Details</h2>
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

// Reusable section component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-500 mb-1">{title}</h4>
      <div className="bg-white p-3 rounded-lg border border-gray-200">
        {children}
      </div>
    </div>
  );
}
