import { useState, useEffect, useCallback, useRef } from 'react';
import { cachedFetch, apiCache } from '@/lib/cache';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [result, setResult] = useState<{ owner: string | null; records: Patient[]; pagination: PaginationData | null }>({ owner: null, records: [], pagination: null });
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPatients = useCallback(async (forceRefresh = false) => {
    abortControllerRef.current?.abort();
    if (!userId) return;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      const data = await cachedFetch(`/api/patients?${params}`, { signal: controller.signal }, 10, forceRefresh);
      if (!controller.signal.aborted && data.success) {
        setResult({ owner: userId, records: data.data, pagination: data.pagination });
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Error fetching patients');
      }
    } finally {
      if (abortControllerRef.current === controller) setLoading(false);
    }
  }, [userId, page, searchTerm, limit]);

  useEffect(() => {
    setResult({ owner: userId, records: [], pagination: null });
    setLoading(false);
    const timeout = setTimeout(() => { void fetchPatients(); }, searchTerm ? 300 : 0);
    return () => {
      clearTimeout(timeout);
      abortControllerRef.current?.abort();
    };
  }, [userId, fetchPatients, searchTerm]);

  const updatePatient = useCallback((id: number, updates: Partial<Patient>) => {
    setResult(prev => prev.owner === userId ? { ...prev, records: prev.records.map(record => record.id === id ? { ...record, ...updates } : record) } : prev);
    apiCache.invalidate('/api/patients');
  }, [userId]);

  const removePatient = useCallback((id: number) => {
    setResult(prev => prev.owner === userId ? { ...prev, records: prev.records.filter(record => record.id !== id) } : prev);
    apiCache.invalidate('/api/patients');
  }, [userId]);

  const addPatient = useCallback((patient: Patient) => {
    setResult(prev => prev.owner === userId ? { ...prev, records: [patient, ...prev.records] } : prev);
    apiCache.invalidate('/api/patients');
  }, [userId]);

  return {
    patients: userId && result.owner === userId ? result.records : [],
    loading: Boolean(userId) && loading,
    pagination: userId && result.owner === userId ? result.pagination : null,
    refetch: () => fetchPatients(true),
    updatePatient, removePatient, addPatient
  };
}
