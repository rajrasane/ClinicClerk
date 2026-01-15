import { create } from 'zustand';

interface Visit {
  id: number;
  patient_id: number;
  patient_name: string;
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
  age: number;
  gender: string;
  consultation_fee: number | null;
  payment_status: 'P' | 'D' | null;
  payment_method: 'C' | 'O' | null;
}

interface VisitStoreState {
  // UI State
  currentPage: number;
  searchQuery: string;
  dateRange: {
    startDate: Date | undefined;
    endDate: Date | undefined;
  };
  showDateFilter: boolean;
  
  // Modal States
  showAddModal: boolean;
  showEditModal: boolean;
  showDetailsModal: boolean;
  
  // Selected Items
  selectedVisit: Visit | null;
  editingVisit: Visit | null;
  
  // Actions - Pagination & Search
  setCurrentPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
  setDateRange: (range: { startDate: Date | undefined; endDate: Date | undefined }) => void;
  clearDateRange: () => void;
  toggleDateFilter: () => void;
  
  // Actions - Add Visit Modal
  openAddModal: () => void;
  closeAddModal: () => void;
  
  // Actions - Edit Visit Modal
  openEditModal: (visit: Visit) => void;
  closeEditModal: () => void;
  
  // Actions - Visit Details Modal
  openDetailsModal: (visit: Visit) => void;
  closeDetailsModal: () => void;
  
  // Reset all state
  reset: () => void;
}

const initialState = {
  currentPage: 1,
  searchQuery: '',
  dateRange: {
    startDate: undefined,
    endDate: undefined,
  },
  showDateFilter: false,
  showAddModal: false,
  showEditModal: false,
  showDetailsModal: false,
  selectedVisit: null,
  editingVisit: null,
};

export const useVisitStore = create<VisitStoreState>((set) => ({
  ...initialState,
  
  // Pagination & Search
  setCurrentPage: (page) => set({ currentPage: page }),
  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }), // Reset to page 1 on search
  setDateRange: (range) => set({ dateRange: range, currentPage: 1 }), // Reset to page 1 on date change
  clearDateRange: () => set({ 
    dateRange: { startDate: undefined, endDate: undefined },
    currentPage: 1 
  }),
  toggleDateFilter: () => set((state) => ({ showDateFilter: !state.showDateFilter })),
  
  // Add Visit Modal
  openAddModal: () => set({ showAddModal: true }),
  closeAddModal: () => set({ showAddModal: false }),
  
  // Edit Visit Modal
  openEditModal: (visit) => set({ 
    showEditModal: true, 
    editingVisit: visit 
  }),
  closeEditModal: () => set({ 
    showEditModal: false, 
    editingVisit: null 
  }),
  
  // Visit Details Modal
  openDetailsModal: (visit) => set({ 
    showDetailsModal: true, 
    selectedVisit: visit 
  }),
  closeDetailsModal: () => set({ 
    showDetailsModal: false, 
    selectedVisit: null 
  }),
  
  // Reset all state
  reset: () => set(initialState),
}));
