import { create } from 'zustand';

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

interface PatientStoreState {
  // UI State
  currentPage: number;
  searchTerm: string;
  
  // Modal States
  showAddModal: boolean;
  showEditModal: boolean;
  showDetailsModal: boolean;
  showAddVisitModal: boolean;
  showVisitDetailsModal: boolean;
  
  // Selected Items
  selectedPatient: Patient | null;
  editingPatient: Patient | null;
  preselectedPatientId: number | null;
  selectedVisit: Visit | null;
  
  // Actions - Pagination & Search
  setCurrentPage: (page: number) => void;
  setSearchTerm: (term: string) => void;
  
  // Actions - Add Patient Modal
  openAddModal: () => void;
  closeAddModal: () => void;
  
  // Actions - Edit Patient Modal
  openEditModal: (patient: Patient) => void;
  closeEditModal: () => void;
  
  // Actions - Patient Details Modal
  openDetailsModal: (patient: Patient) => void;
  closeDetailsModal: () => void;
  
  // Actions - Add Visit Modal
  openAddVisitModal: (patientId?: number) => void;
  closeAddVisitModal: () => void;
  
  // Actions - Visit Details Modal
  openVisitDetailsModal: (visit: Visit) => void;
  closeVisitDetailsModal: () => void;
  
  // Reset all state
  reset: () => void;
}

const initialState = {
  currentPage: 1,
  searchTerm: '',
  showAddModal: false,
  showEditModal: false,
  showDetailsModal: false,
  showAddVisitModal: false,
  showVisitDetailsModal: false,
  selectedPatient: null,
  editingPatient: null,
  preselectedPatientId: null,
  selectedVisit: null,
};

export const usePatientStore = create<PatientStoreState>((set) => ({
  ...initialState,
  
  // Pagination & Search
  setCurrentPage: (page) => set({ currentPage: page }),
  setSearchTerm: (term) => set({ searchTerm: term, currentPage: 1 }), // Reset to page 1 on search
  
  // Add Patient Modal
  openAddModal: () => set({ showAddModal: true }),
  closeAddModal: () => set({ showAddModal: false }),
  
  // Edit Patient Modal
  openEditModal: (patient) => set({ 
    showEditModal: true, 
    editingPatient: patient 
  }),
  closeEditModal: () => set({ 
    showEditModal: false, 
    editingPatient: null 
  }),
  
  // Patient Details Modal
  openDetailsModal: (patient) => set({ 
    showDetailsModal: true, 
    selectedPatient: patient 
  }),
  closeDetailsModal: () => set({ 
    showDetailsModal: false, 
    selectedPatient: null 
  }),
  
  // Add Visit Modal
  openAddVisitModal: (patientId) => set({ 
    showAddVisitModal: true, 
    preselectedPatientId: patientId ?? null 
  }),
  closeAddVisitModal: () => set({ 
    showAddVisitModal: false, 
    preselectedPatientId: null 
  }),
  
  // Visit Details Modal
  openVisitDetailsModal: (visit) => set({ 
    showVisitDetailsModal: true, 
    selectedVisit: visit 
  }),
  closeVisitDetailsModal: () => set({ 
    showVisitDetailsModal: false, 
    selectedVisit: null 
  }),
  
  // Reset all state
  reset: () => set(initialState),
}));
