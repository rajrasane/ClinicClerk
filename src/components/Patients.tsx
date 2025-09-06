'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { usePatients } from '@/hooks/usePatients';
import { apiCache } from '@/lib/cache';
import AddPatientModalNew from './AddPatientModalNew';
import PatientDetailsModal from './PatientDetailsModal';
import EditPatientModal from './EditPatientModal';
import AddVisitModal from './AddVisitModal';
import { supabase } from '@/lib/supabase';


interface Patient {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  age: number;
  age_recorded_at: string;
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

export default function AdminPatients() {
  // Use the custom hook for data management
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const { patients, loading, pagination, refetch, removePatient } = usePatients(currentPage, searchTerm, 5);

  // Component state for modals
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [preselectedPatientId, setPreselectedPatientId] = useState<number | null>(null);

  const totalPages = pagination?.totalPages || 1;

  const handleViewPatient = (patient: Patient) => {
    // Show modal immediately with existing patient data
    setSelectedPatient(patient);
    setShowModal(true);
  };


  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setShowEditModal(true);
  };

  const handleDeletePatient = async (patientId: number, patientName: string) => {
    if (!confirm(`Are you sure you want to delete ${patientName}? This will also delete all their visits.`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        toast.success('Patient deleted successfully!');
        // Clear cache and refresh
        apiCache.invalidate('/api/patients');
        apiCache.invalidate('/api/visits'); // Clear visits cache since patient visits are deleted
        removePatient(patientId); // Optimistic update
        refetch(); // Fetch fresh data and cache it
      } else {
        toast.error('Failed to delete patient');
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Failed to delete patient. Please try again.');
    }
  };

  const handleAddVisit = (patientId: number) => {
    setPreselectedPatientId(patientId);
    setShowAddVisitModal(true);
  };

  // Removed unused formatDate function


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-700">Patient Management</h2>
          <p className="text-gray-600">Manage patient records and information</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Patient</span>
        </button>
      </div>

      {/* Search and Filter */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search patients by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
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
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Age/Gender
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Phone
                </th>
                <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-3 sm:px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 sm:px-6 py-4 text-center text-gray-500">
                    No patients found
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 font-medium text-sm sm:text-base">
                          {`${patient.first_name[0]}${patient.last_name[0]}`}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.first_name}{' '}{patient.last_name}
                          </div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            {patient.age}yrs • {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                            {patient.phone && ` • ${patient.phone}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                      <div className="text-sm text-gray-900">
                        {patient.age} years
                      </div>
                      <div className="text-sm text-gray-500">
                        {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                      <div className="text-sm text-gray-900">{patient.phone || '-'}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-center">
                      <div className="flex justify-center items-center space-x-2 lg:space-x-3">
                        <button
                          onClick={() => handleViewPatient(patient)}
                          className="px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors text-sm font-medium"
                          title="View Details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditPatient(patient)}
                          className="inline-flex items-center justify-center h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-full sm:rounded-md bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-colors"
                          title="Edit Patient"
                        >
                          <svg className="h-4 w-4 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline sm:ml-2 text-sm font-medium">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeletePatient(patient.id, `${patient.first_name} ${patient.last_name}`)}
                          className="inline-flex items-center justify-center h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-full sm:rounded-md bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                          title="Delete Patient"
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

      {/* Patient Details Modal */}
      {showModal && selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => {
            setShowModal(false);
            setSelectedPatient(null);
          }}
          onUpdate={refetch}
          onAddVisit={handleAddVisit}
        />
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <AddPatientModalNew
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            apiCache.invalidate('/api/patients');
            refetch();
          }}
        />
      )}

      {/* Edit Patient Modal */}
      {showEditModal && editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          onClose={() => {
            setShowEditModal(false);
            setEditingPatient(null);
          }}
          onSuccess={() => {
            apiCache.invalidate('/api/patients');
            apiCache.invalidate('/api/visits'); // Clear visits cache since patient data changed
            refetch(); // Fetch fresh data and cache it
          }}
        />
      )}

      {/* Add Visit Modal */}
      {showAddVisitModal && (
        <AddVisitModal
          onClose={() => {
            setShowAddVisitModal(false);
            setPreselectedPatientId(null);
          }}
          onSuccess={() => {
            apiCache.invalidate('/api/patients');
            setShowAddVisitModal(false);
            setPreselectedPatientId(null);
          }}
          preselectedPatientId={preselectedPatientId || undefined}
        />
      )}
    </div>
  );
}
