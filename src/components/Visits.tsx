'use client';

import { useState, useEffect } from 'react';
import VisitDetailsModal from '@/components/VisitDetailsModal';
import AddVisitModal from '@/components/AddVisitModal';

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

export default function AdminVisits() {
  // Component state
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false); // Start as false to avoid flash on mount
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Effect for filter changes to reset pagination
  useEffect(() => {
    if (searchQuery || dateRange.startDate || dateRange.endDate) {
      setCurrentPage(1);
    }
  }, [searchQuery, dateRange.startDate, dateRange.endDate]);

  // Main data fetching effect
  useEffect(() => {
    // Skip invalid date ranges
    if ((dateRange.startDate && !dateRange.endDate) || (!dateRange.startDate && dateRange.endDate)) {
      return;
    }

    let isSubscribed = true;
    const controller = new AbortController();
    setLoading(true);

    const fetchVisits = async () => {
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10'
        });

        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }

        if (dateRange.startDate && dateRange.endDate) {
          params.append('startDate', dateRange.startDate);
          params.append('endDate', dateRange.endDate);
        }

        const response = await fetch(`/api/visits?${params}`, {
          signal: controller.signal
        });
        
        if (!isSubscribed) return;
        
        const data = await response.json();

        if (data.success && isSubscribed) {
          setVisits(data.data);
          setTotalPages(data.pagination.totalPages);
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError' && isSubscribed) {
          console.error('Error fetching visits:', error);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    // Start loading immediately for page changes only
    if (!searchQuery && !dateRange.startDate && !dateRange.endDate) {
      fetchVisits();
      return () => {
        isSubscribed = false;
        controller.abort();
      };
    }

    // Debounce filter changes
    const timeoutId = setTimeout(fetchVisits, 300);
    
    return () => {
      isSubscribed = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [currentPage, searchQuery, dateRange.startDate, dateRange.endDate]);

  

  // Fetch function for component callbacks
  const fetchVisitsData = () => {
    setCurrentPage(1);
    // The main useEffect will handle the actual data fetching
  };

  const handleViewVisit = (visit: Visit) => {
    setSelectedVisit(visit);
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatVitals = (vitals: any) => {
    if (!vitals) return 'Not recorded';
    
    const vitalsArray = [];
    if (vitals.temperature) vitalsArray.push(`Temp: ${vitals.temperature}`);
    if (vitals.bp) vitalsArray.push(`BP: ${vitals.bp}`);
    if (vitals.pulse) vitalsArray.push(`Pulse: ${vitals.pulse}`);
    
    return vitalsArray.length > 0 ? vitalsArray.join(' | ') : 'Not recorded';
  };

  return (
    <div className="space-y-6">
      {/* Controls Section */}
        {/* Header Section */}
        <div className="flex flex-col gap-4">
        {/* Header and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Visit Management</h2>
            <p className="text-gray-600">Record and manage patient visits</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Visit
          </button>
        </div>

        {/* Search and Date Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by patient name or complaint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              min={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Visits Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading visits...</p>
          </div>
        ) : visits.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No visits found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visit Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chief Complaint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diagnosis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vitals
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Visit #{visit.id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(visit.visit_date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {visit.first_name} {visit.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {visit.patient_id} | {visit.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {visit.chief_complaint}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {visit.diagnosis || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500">
                          {formatVitals(visit.vitals)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex justify-center items-center">
                          <button
                            onClick={() => handleViewVisit(visit)}
                            className="inline-flex items-center px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-md transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Visit Details Modal */}
      {showModal && selectedVisit && (
        <VisitDetailsModal
          visit={selectedVisit}
          onClose={() => {
            setShowModal(false);
            setSelectedVisit(null);
          }}
          onUpdate={fetchVisitsData}
        />
      )}

      {/* Add Visit Modal */}
      {showAddModal && (
        <AddVisitModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchVisitsData}
        />
      )}
    </div>
  );
}
