'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import VisitDetailsModal from '@/components/VisitDetailsModal';
import AddVisitModal from '@/components/AddVisitModal';
import EditVisitModal from '@/components/EditVisitModal';

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

export default function AdminVisits() {
  // Component state
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
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
      } catch (error: unknown) {
        if ((error as Error)?.name !== 'AbortError' && isSubscribed) {
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

  const handleEditVisit = (visit: Visit) => {
    setEditingVisit(visit);
    setShowEditModal(true);
  };

  const handleDeleteVisit = async (visitId: number, patientName: string) => {
    if (!confirm(`Are you sure you want to delete this visit for ${patientName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/visits/${visitId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Visit deleted successfully!');
        fetchVisitsData(); // Refresh the list
      } else {
        const errorMessage = 'Failed to delete visit';
        console.error('Error deleting visit:', response);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting visit:', error);
      toast.error('Failed to delete visit. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatVitals = (vitals: Record<string, string> | null) => {
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
      <div className="flex flex-col gap-4">
        {/* Header and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Visit Management</h2>
            <p className="text-gray-600">Record and manage patient visits</p>
          </div>
          <div className="flex items-center gap-11">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`order-2 md:order-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                showDateFilter 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter by Date
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="order-1 md:order-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Visit</span>
            </button>
          </div>
        </div>

        {/* Search and Date Filters */}
        <div className='mt-2'>
          {/* Search Input */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by patient name or complaint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Date Inputs */}
          <div className="space-y-4 mt-2">

            {/* Date Inputs */}
            {showDateFilter && (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm lg:text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm lg:text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    min={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visits Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visit
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Patient
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Chief Complaint
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Diagnosis
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  </td>
                </tr>
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-6 py-4 text-center text-gray-500">
                    No visits found
                  </td>
                </tr>
              ) : (
                visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500">
                          {formatDate(visit.visit_date)}
                        </div>
                        
                        <div className="sm:hidden space-y-1 mt-1">
                          <div className="text-xs text-gray-700 font-medium">
                            {visit.first_name} {visit.last_name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {visit.chief_complaint.length > 50 ? `${visit.chief_complaint.substring(0, 50)}...` : visit.chief_complaint}
                          </div>
                          {visit.diagnosis && (
                            <div className="text-xs text-green-700">
                              <span className="font-medium">Dx:</span> {visit.diagnosis.length > 40 ? `${visit.diagnosis.substring(0, 40)}...` : visit.diagnosis}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                      <div className="text-sm font-medium text-gray-900">
                        {visit.first_name} {visit.last_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {visit.patient_id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {visit.phone}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {visit.chief_complaint}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {visit.diagnosis || 'Not specified'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {visit.vitals?.weight && (
                          <div>Weight: {visit.vitals.weight.toLowerCase().includes('kg') ? visit.vitals.weight : `${visit.vitals.weight} kg`}</div>
                        )}
                        {formatVitals(visit.vitals)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-center">
                      <div className="flex justify-center items-center space-x-2 lg:space-x-3">
                        <button
                          onClick={() => handleViewVisit(visit)}
                          className="px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors text-sm font-medium"
                          title="View Details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditVisit(visit)}
                          className="inline-flex items-center justify-center h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-full sm:rounded-md bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-colors"
                          title="Edit Visit"
                        >
                          <svg className="h-4 w-4 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline sm:ml-2 text-sm font-medium">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteVisit(visit.id, `${visit.first_name} ${visit.last_name}`)}
                          className="inline-flex items-center justify-center h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-full sm:rounded-md bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                          title="Delete Visit"
                        >
                          <svg className="h-4 w-4 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="hidden sm:inline sm:ml-2 text-sm font-medium">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 sm:px-4 py-2 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 sm:px-4 py-2 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
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

      {/* Edit Visit Modal */}
      {showEditModal && editingVisit && (
        <EditVisitModal
          visit={editingVisit}
          onClose={() => {
            setShowEditModal(false);
            setEditingVisit(null);
          }}
          onSuccess={fetchVisitsData}
        />
      )}
    </div>
  );
}
