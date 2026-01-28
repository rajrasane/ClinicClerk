import { useState, useEffect, useCallback, useRef } from 'react';
import { cachedFetch, apiCache } from '@/lib/cache';
import type { Patient, PaginationData } from '@/types';


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
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPatients = useCallback(async (forceRefresh = false) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      let data;
      if (forceRefresh) {
        // Bypass cache for forced refresh
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`/api/patients?${params}`, {
          credentials: 'include',
          headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
        });
        data = await response.json();

        // Cache the fresh data for subsequent requests
        if (data.success) {
          apiCache.set(`/api/patients?${params}{}`, data, 10);
        }
      } else {
        data = await cachedFetch(`/api/patients?${params}`, undefined, 10); // 10 min cache
      }

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
      // Abort any pending request when component unmounts or dependencies change
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
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
    refetch: () => fetchPatients(true), // Force refresh when manually called
    updatePatient,
    removePatient,
    addPatient
  };
}
