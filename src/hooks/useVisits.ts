import { useState, useEffect, useCallback, useRef } from 'react';
import { cachedFetch, apiCache } from '@/lib/cache';
import { useAuth } from '@/contexts/AuthContext';
import type { Visit, PaginationData } from '@/types';

interface UseVisitsReturn {
  visits: Visit[];
  loading: boolean;
  pagination: PaginationData | null;
  refetch: () => Promise<void>;
  updateVisit: (id: number, updates: Partial<Visit>) => void;
  removeVisit: (id: number) => void;
  addVisit: (visit: Visit) => void;
}

export function useVisits(page: number = 1, searchQuery: string = '',
  dateRange: { startDate: string; endDate: string } = { startDate: '', endDate: '' },
  limit: number = 5): UseVisitsReturn {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [result, setResult] = useState<{ owner: string | null; records: Visit[]; pagination: PaginationData | null }>({ owner: null, records: [], pagination: null });
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchVisits = useCallback(async (forceRefresh = false) => {
    abortControllerRef.current?.abort();
    if (!userId) return;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (dateRange.startDate && dateRange.endDate) {
        params.set('startDate', dateRange.startDate);
        params.set('endDate', dateRange.endDate);
      }
      const data = await cachedFetch(`/api/visits?${params}`, { signal: controller.signal }, 10, forceRefresh);
      if (!controller.signal.aborted && data.success) {
        setResult({ owner: userId, records: data.data, pagination: data.pagination });
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Error fetching visits');
      }
    } finally {
      if (abortControllerRef.current === controller) setLoading(false);
    }
  }, [userId, page, searchQuery, limit, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    setResult({ owner: userId, records: [], pagination: null });
    setLoading(false);
    const timeout = setTimeout(() => { void fetchVisits(); }, searchQuery || dateRange.startDate || dateRange.endDate ? 300 : 0);
    return () => {
      clearTimeout(timeout);
      abortControllerRef.current?.abort();
    };
  }, [userId, fetchVisits, searchQuery, dateRange.startDate, dateRange.endDate]);

  const updateVisit = useCallback((id: number, updates: Partial<Visit>) => {
    setResult(prev => prev.owner === userId ? { ...prev, records: prev.records.map(record => record.id === id ? { ...record, ...updates } : record) } : prev);
    apiCache.invalidate('/api/visits');
  }, [userId]);

  const removeVisit = useCallback((id: number) => {
    setResult(prev => prev.owner === userId ? { ...prev, records: prev.records.filter(record => record.id !== id) } : prev);
    apiCache.invalidate('/api/visits');
  }, [userId]);

  const addVisit = useCallback((visit: Visit) => {
    setResult(prev => prev.owner === userId ? { ...prev, records: [visit, ...prev.records] } : prev);
    apiCache.invalidate('/api/visits');
  }, [userId]);

  return {
    visits: userId && result.owner === userId ? result.records : [],
    loading: Boolean(userId) && loading,
    pagination: userId && result.owner === userId ? result.pagination : null,
    refetch: () => fetchVisits(true),
    updateVisit, removeVisit, addVisit
  };
}
