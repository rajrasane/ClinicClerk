'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useVisits } from '@/hooks/useVisits';
import { apiCache } from '@/lib/cache';
import { DatePicker } from '@/components/ui/date-picker';
import { supabase } from '@/lib/supabase';
import { ExportDropdown } from '@/components/ui/export-dropdown';
import type { Visit } from '@/types';
import dynamic from 'next/dynamic';

const AddVisitModal = dynamic(() => import('./AddVisitModal'), { ssr: false });
const VisitDetailsModal = dynamic(() => import('./VisitDetailsModal'), { ssr: false });
const EditVisitModal = dynamic(() => import('./EditVisitModal'), { ssr: false });


export default function AdminVisits() {
  // State for filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined
  });

  // Helper function to format date without timezone issues
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Convert dates to strings for API
  const dateRangeForAPI = {
    startDate: dateRange.startDate ? formatDateForAPI(dateRange.startDate) : '',
    endDate: dateRange.endDate ? formatDateForAPI(dateRange.endDate) : ''
  };

  // Use the custom hook for data management
  const { visits, loading, pagination, refetch, removeVisit } = useVisits(currentPage, searchQuery, dateRangeForAPI, 5);

  // Modal state
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const totalPages = pagination?.totalPages || 1;

  // Refetch function for callbacks - now uses the hook
  const fetchVisitsData = () => {
    apiCache.invalidate('/api/visits');
    refetch();
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/visits/${visitId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        toast.success('Visit deleted successfully!');
        apiCache.invalidate('/api/patients'); // Clear patients cache to update visit counts
        apiCache.invalidate('/api/visits'); // Clear visits cache
        removeVisit(visitId); // Optimistic update
        // Trigger immediate refetch to sync with server
        await refetch();
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

  return (
    <div className="space-y-6">
      {/* Controls Section */}
      <div className="flex flex-col gap-4">
        {/* Header and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-700">Visit Management</h2>
            <p className="text-gray-600">Record and manage patient visits</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Visit</span>
            </button>
            <div className="md:hidden">
              <ExportDropdown
                type="visits"
                filters={{
                  search: searchQuery,
                  startDate: dateRangeForAPI.startDate,
                  endDate: dateRangeForAPI.endDate
                }}
                variant="icon"
                hasRecords={visits.length > 0}
              />
            </div>
            <div className="hidden md:block">
              <ExportDropdown
                type="visits"
                filters={{
                  search: searchQuery,
                  startDate: dateRangeForAPI.startDate,
                  endDate: dateRangeForAPI.endDate
                }}
                buttonText="Export Visits"
                hasRecords={visits.length > 0}
              />
            </div>
          </div>
        </div>

        {/* Search and Date Filters */}
        <div className='mt-2'>
          {/* Search Input with Filter Button */}
          <div className="relative w-full flex items-center">
            <div className="relative grow mr-1 sm:mr-2">
              <input
                type="text"
                placeholder="Search by patient name or complaint…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base bg-white"
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
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 transition-colors z-10"
                  aria-label="Clear search"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={() => {
                if (dateRange.startDate && dateRange.endDate) {
                  // If both dates are selected, do nothing
                  return;
                } else {
                  setShowDateFilter(!showDateFilter);
                }
              }}
              disabled={!!(dateRange.startDate && dateRange.endDate)}
              className={`ml-1 sm:ml-2 p-2.75 rounded-lg transition-colors flex items-center gap-2 ${dateRange.startDate && dateRange.endDate
                ? 'bg-red-100 text-red-700 cursor-not-allowed opacity-75'
                : showDateFilter
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : (dateRange.startDate || dateRange.endDate)
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="hidden md:inline text-sm">Filter by Date</span>
            </button>
          </div>

          {/* Date Inputs */}
          <div className="space-y-4 mt-2">
            {showDateFilter && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <DatePicker
                    date={dateRange.startDate}
                    onDateChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                    placeholder="Start date"
                    className="text-xs"
                  />
                  <DatePicker
                    date={dateRange.endDate}
                    onDateChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                    placeholder="End date"
                    className="text-xs"
                    disabled={!dateRange.startDate}
                  />
                </div>

                {/* Clear Date Filters Button */}
                {(dateRange.startDate || dateRange.endDate) && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setDateRange({ startDate: undefined, endDate: undefined })}
                      className="text-sm text-gray-600 hover:text-gray-800 underline transition-colors"
                    >
                      Clear date filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visits Table */}
      <div className="glass-panel rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto md:overflow-x-visible">
          <table className="min-w-full md:w-full md:table-fixed">
            <thead className="bg-linear-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:w-[15%] lg:w-[12%]">
                  Visit
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell md:w-[22%] lg:w-[18%]">
                  Patient
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell md:w-[30%] lg:w-[28%]">
                  Chief Complaint
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell lg:w-[22%]">
                  Diagnosis
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider md:w-[33%] lg:w-[20%]">
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
                        <div className="text-xs md:text-sm text-gray-500">
                          {formatDate(visit.visit_date)}
                        </div>

                        <div className="sm:hidden space-y-1 mt-1">
                          <div className="text-sm text-gray-700 font-medium">
                            {visit.first_name} {visit.last_name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {visit.chief_complaint.length > 50 ? `${visit.chief_complaint.substring(0, 50)}…` : visit.chief_complaint}
                          </div>
                          {visit.diagnosis && (
                            <div className="text-xs text-green-700">
                              <span className="font-medium">Dx:</span> {visit.diagnosis.length > 40 ? `${visit.diagnosis.substring(0, 40)}…` : visit.diagnosis}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                      <div className="text-sm sm:text-base font-medium text-gray-900">
                        {visit.first_name} {visit.last_name}
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
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-center">
                      <div className="flex justify-center items-center space-x-2 md:space-x-1 lg:space-x-1.5">
                        <button
                          onClick={() => handleViewVisit(visit)}
                          className="px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors text-sm font-medium md:text-xs md:px-2 lg:text-xs lg:px-2.5 whitespace-nowrap"
                          title="View Details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditVisit(visit)}
                          className="inline-flex items-center justify-center h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-full sm:rounded-md bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-colors md:px-2 lg:px-2.5 whitespace-nowrap"
                          title="Edit Visit"
                        >
                          <svg className="h-4 w-4 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline sm:ml-2 text-sm font-medium md:ml-1 md:text-xs lg:text-xs">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteVisit(visit.id, `${visit.first_name} ${visit.last_name}`)}
                          className="inline-flex items-center justify-center h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-full sm:rounded-md bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors md:px-2 lg:px-2.5 whitespace-nowrap"
                          title="Delete Visit"
                        >
                          <svg className="h-4 w-4 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="hidden sm:inline sm:ml-2 text-sm font-medium md:ml-1 md:text-xs lg:text-xs">Delete</span>
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
          onEdit={handleEditVisit}
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