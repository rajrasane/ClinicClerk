'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PatientDetailsModal from './PatientDetailsModal';
import AddPatientModal from './AddPatientModalNew';
import EditPatientModal from './EditPatientModal';
import AddVisitModal from './AddVisitModal';

interface Visit {
  id: number;
  visit_date: string;
  chief_complaint: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  vitals: any;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  address: string;
  blood_group?: string;
  allergies: string;
  emergency_contact?: string;
  created_at: string;
  updated_at: string;
  visits?: Visit[];
  visit_count?: number;
}

export default function AdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [preselectedPatientId, setPreselectedPatientId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Effect for filter changes to reset pagination
  useEffect(() => {
    if (searchTerm) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  // Main data fetching effect
  useEffect(() => {
    let isSubscribed = true;
    const controller = new AbortController();

    const loadData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10'
        });
        
        // Only add search param if we have a search term
        if (searchTerm.trim()) {
          params.append('search', searchTerm.trim());
        }

        const response = await fetch(`/api/patients?${params}`, {
          signal: controller.signal
        });
        
        if (!isSubscribed) return;
        
        const data = await response.json();
        if (data.success) {
          setPatients(data.data);
          setTotalPages(data.pagination.totalPages);
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError' && isSubscribed) {
          console.error('Error fetching patients:', error);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    // Start loading immediately for page changes only
    if (!searchTerm) {
      loadData();
      return () => {
        isSubscribed = false;
        controller.abort();
      };
    }

    // Debounce search changes
    const timeoutId = setTimeout(loadData, 300);
    
    return () => {
      isSubscribed = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [currentPage, searchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await fetch(`/api/patients?${params}`);
      const data = await response.json();

      if (data.success) {
        setPatients(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = async (patientId: number) => {
    // Show modal immediately with loading state
    setShowModal(true);
    setSelectedPatient(null);
    
    try {
      const response = await fetch(`/api/patients/${patientId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedPatient(data.data);
      } else {
        setShowModal(false);
        console.error('Failed to fetch patient details');
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      setShowModal(false);
    }
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
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Patient deleted successfully!');
        fetchPatients(); // Refresh the list
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Management</h2>
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
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            {calculateAge(patient.date_of_birth)}yrs • {patient.gender}
                            {patient.phone && ` • ${patient.phone}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                      <div className="text-sm text-gray-900">
                        {calculateAge(patient.date_of_birth)} years
                      </div>
                      <div className="text-sm text-gray-500">
                        {patient.gender}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                      <div className="text-sm text-gray-900">{patient.phone || '-'}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-center">
                      <div className="flex justify-center items-center space-x-2 lg:space-x-3">
                        <button
                          onClick={() => handleViewPatient(patient.id)}
                          className="px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors text-sm font-medium"
                          title="View Details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditPatient(patient)}
                          className="px-3 py-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-colors text-sm font-medium"
                          title="Edit Patient"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePatient(patient.id, `${patient.first_name} ${patient.last_name}`)}
                          className="hidden sm:inline-flex items-center justify-center h-9 w-9 lg:h-auto lg:w-auto lg:px-3 lg:py-2 rounded-full lg:rounded-md bg-red-50 lg:bg-transparent text-red-600 hover:bg-red-100 lg:hover:bg-red-50 hover:text-red-700 transition-colors"
                          title="Delete Patient"
                        >
                          <svg className="h-5 w-5 lg:h-4 lg:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="hidden lg:inline ml-2 text-red-700">Delete</span>
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
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-600">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <div className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border-t border-b border-gray-300">
                {currentPage}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
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
          onUpdate={fetchPatients}
          onAddVisit={handleAddVisit}
        />
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchPatients}
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
          onSuccess={fetchPatients}
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
            fetchPatients(); // Refresh patients to update visit counts
            setShowAddVisitModal(false);
            setPreselectedPatientId(null);
          }}
          preselectedPatientId={preselectedPatientId || undefined}
        />
      )}
    </div>
  );
}
