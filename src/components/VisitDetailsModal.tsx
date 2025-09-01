'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Edit2, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('details');
  const [mounted, setMounted] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !visit) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatVitals = (vitals: any) => {
    if (!vitals) return {};
    return vitals;
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 200);
  };

  const renderContent = () => (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      {/* Patient Info Header */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800">
          {visit.first_name} {visit.last_name}
        </h3>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mt-2">
          <div>Phone: {visit.phone || 'N/A'}</div>
          <div>Visit Date: {formatDateTime(visit.visit_date)}</div>
          {visit.follow_up_date && (
            <div>Follow-up: {formatDate(visit.follow_up_date)}</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Visit Details
          </button>
          <button
            onClick={() => setActiveTab('vitals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vitals'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vitals
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'details' ? (
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
              
              <Section title="Notes">
                <p className="whitespace-pre-line text-gray-800">
                  {visit.notes || 'No additional notes'}
                </p>
              </Section>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            {Object.keys(visit.vitals || {}).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(formatVitals(visit.vitals)).map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-50 rounded">
                    <div className="text-sm font-medium text-gray-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {String(value) || '—'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No vitals recorded for this visit</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/30 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className={`relative bg-white/90 backdrop-blur-md rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col ${
            isPrinting ? 'w-full h-full max-h-none max-w-none m-0 rounded-none' : ''
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">Visit Details</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onUpdate}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Edit visit"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={handlePrint}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Print visit details"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          {renderContent()}

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-3 flex justify-between items-center bg-gray-50/50">
            <div className="flex-1 flex items-center justify-between sm:hidden">
              <button
                onClick={() => setActiveTab(activeTab === 'details' ? 'vitals' : 'details')}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {activeTab === 'vitals' ? 'Details' : 'Vitals'}
              </button>
              <div className="text-sm text-gray-500">
                {activeTab === 'details' ? '1' : '2'} of 2
              </div>
              <button
                onClick={() => setActiveTab(activeTab === 'details' ? 'vitals' : 'details')}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {activeTab === 'details' ? 'Vitals' : 'Details'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

// Reusable section component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-500 mb-1">{title}</h4>
      <div className="bg-white/50 p-3 rounded-lg border border-gray-200">
        {children}
      </div>
    </div>
  );
}
