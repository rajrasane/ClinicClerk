'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
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
  images?: Array<{url: string, filename: string, uploaded_at: string}>;
}

interface VisitDetailsModalProps {
  visit: Visit;
  onClose: () => void;
}

export default function VisitDetailsModal({ visit, onClose }: VisitDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  interface VisitImage {
    url: string;
    filename: string;
    uploaded_at: string;
  }
  
  const [visitImages, setVisitImages] = useState<VisitImage[]>([]);
  
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

  // Reset images when visit changes
  useEffect(() => {
    setImagesLoaded(false);
    setVisitImages([]);
    setActiveTab('details'); // Reset to details tab
  }, [visit.id]);

  const loadImages = async () => {
    if (imagesLoaded || imagesLoading) return;
    
    // Check if visit has images
    if (!visit.images || !Array.isArray(visit.images) || visit.images.length === 0) {
      console.log('ℹ️ No images to load for this visit');
      setVisitImages([]);
      setImagesLoaded(true);
      return;
    }
    
    console.log('🚀 BANDWIDTH SAVINGS: Loading', visit.images.length, 'images only when needed');
    const startTime = performance.now();
    
    setImagesLoading(true);
    try {
      // Use existing visit data - no need to fetch fresh data every time
      setVisitImages(visit.images);
      setImagesLoaded(true);
      
      const loadTime = performance.now() - startTime;
      console.log('✅ Images loaded in', Math.round(loadTime), 'ms');
      console.log('💾 Estimated bandwidth saved by lazy loading: ~', (visit.images.length * 350), 'KB');
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setImagesLoading(false);
    }
  };

  const handleImagesTab = () => {
    setActiveTab('images');
    if (!imagesLoaded) {
      console.log('🔄 LAZY LOADING: Loading images for first time - saving bandwidth!');
      console.log('📊 Images to load:', visit.images?.length || 0);
      loadImages();
    } else {
      console.log('✅ CACHED: Images already loaded, using cached data');
    }
  };

  // Swipe detection
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    console.log('👆 Touch start:', e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    console.log('📱 Swipe detected:', { distance, isLeftSwipe, isRightSwipe, activeTab });

    if (isLeftSwipe && activeTab === 'details' && visit.images?.length) {
      // Swipe left: details -> images
      console.log('⬅️ Swiping to images tab');
      handleImagesTab();
    } else if (isRightSwipe && activeTab === 'images') {
      // Swipe right: images -> details
      console.log('➡️ Swiping to details tab');
      setActiveTab('details');
    }
  };

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
      <AnimatePresence mode="wait">
        {activeTab === 'details' && (
          <motion.div
            key="details"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 10, opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="space-y-6"
          >
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
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                  {visit.prescription || 'No prescription'}
                </p>
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
              <hr className="border-gray-200" />
              <h3 className="text-lg font-semibold text-gray-900">Vital Signs</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(formatVitals(visit.vitals)).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-500 capitalize mb-1">
                      {key === 'bp' ? 'Blood Pressure' : key.replace(/_/g, ' ')}
                    </label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {String(value) || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {visit.notes && (
            <div className="space-y-4">
              <hr className="border-gray-200" />
              <div>
                <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{visit.notes}</p>
              </div>
            </div>
          )}
          </motion.div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <motion.div
            key="images"
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -10, opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="space-y-4"
          >
          {imagesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : visitImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {visitImages.map((image, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={image.url}
                    alt={`Visit image ${index + 1}`}
                    width={128}
                    height={128}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => window.open(image.url, '_blank')}
                    unoptimized={true} // Since we're using external URLs
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-xs text-center p-2">
                      <div className="font-medium">{image.filename}</div>
                      <div>{new Date(image.uploaded_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No images uploaded for this visit</p>
            </div>
          )}
          </motion.div>
        )}
      </AnimatePresence>
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
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ touchAction: 'pan-y' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {visit.first_name} {visit.last_name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(visit.visit_date)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
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
              Visit Details
            </button>
            {visit.images && Array.isArray(visit.images) && visit.images.length > 0 && (
              <button
                onClick={handleImagesTab}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex-1 sm:flex-none text-center ${
                  activeTab === 'images'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Images ({visit.images.length})
              </button>
            )}
          </nav>
        </div>

          {/* Main Content */}
          {renderContent()}

          {/* Footer */}
          <div className="flex justify-end p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
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
