import { useState, useEffect, useCallback } from 'react';
import { cachedFetch, apiCache } from '@/lib/cache';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  age: number;
  age_recorded_at: string;
  gender: string;
  phone: string;
  address: string;
  blood_group: string;
  allergies: string;
  emergency_contact: string;
  created_at: string;
  updated_at: string;
  visit_count?: number;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UsePatientsReturn {
  patients: Patient[];
  loading: boolean;
  pagination: PaginationData | null;
  refetch: () => Promise<void>;
  updatePatient: (id: number, updates: Partial<Patient>) => void;
  removePatient: (id: number) => void;
  addPatient: (patient: Patient) => void;
}

export function usePatients(page: number = 1, searchTerm: string = '', limit: number = 10): UsePatientsReturn {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const data = await cachedFetch(`/api/patients?${params}`, undefined, 10); // 10 min cache
      
      if (data.success) {
        setPatients(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, limit]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (searchTerm) {
      // Debounce search
      timeoutId = setTimeout(fetchPatients, 300);
    } else {
      // Immediate load for page changes
      fetchPatients();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fetchPatients, searchTerm]);

  // Optimistic updates to avoid unnecessary refetches
  const updatePatient = useCallback((id: number, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    // Only invalidate list cache - individual patient cache not needed for optimistic updates
    apiCache.invalidate('/api/patients?');
  }, []);

  const removePatient = useCallback((id: number) => {
    setPatients(prev => prev.filter(p => p.id !== id));
    // No cache invalidation needed - UI is already updated optimistically
  }, []);

  const addPatient = useCallback((patient: Patient) => {
    setPatients(prev => [patient, ...prev]);
    // Invalidate cache to ensure fresh data on next fetch
    apiCache.invalidate('/api/patients?');
  }, []);

  return {
    patients,
    loading,
    pagination,
    refetch: fetchPatients,
    updatePatient,
    removePatient,
    addPatient
  };
}
