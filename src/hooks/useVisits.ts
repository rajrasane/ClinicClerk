import { useState, useEffect, useCallback } from 'react';
import { cachedFetch, apiCache } from '@/lib/cache';

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

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UseVisitsReturn {
  visits: Visit[];
  loading: boolean;
  pagination: PaginationData | null;
  refetch: () => Promise<void>;
  updateVisit: (id: number, updates: Partial<Visit>) => void;
  removeVisit: (id: number) => void;
  addVisit: (visit: Visit) => void;
}

export function useVisits(
  page: number = 1, 
  searchQuery: string = '', 
  dateRange: { startDate: string; endDate: string } = { startDate: '', endDate: '' },
  limit: number = 5
): UseVisitsReturn {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      if (dateRange.startDate && dateRange.endDate) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }

      const data = await cachedFetch(`/api/visits?${params}`, undefined, 10); // 10 min cache
      
      if (data.success) {
        setVisits(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, dateRange.startDate, dateRange.endDate, limit]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (searchQuery || dateRange.startDate || dateRange.endDate) {
      // Debounce search and filter changes
      timeoutId = setTimeout(fetchVisits, 300);
    } else {
      // Immediate load for page changes
      fetchVisits();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fetchVisits, searchQuery, dateRange.startDate, dateRange.endDate]);

  // Optimistic updates
  const updateVisit = useCallback((id: number, updates: Partial<Visit>) => {
    setVisits(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    // Only invalidate list cache - individual visit cache not needed for optimistic updates
    apiCache.invalidate('/api/visits?');
  }, []);

  const removeVisit = useCallback((id: number) => {
    setVisits(prev => prev.filter(v => v.id !== id));
    // No cache invalidation needed - UI is already updated optimistically
  }, []);

  const addVisit = useCallback((visit: Visit) => {
    setVisits(prev => [visit, ...prev]);
    apiCache.invalidate('/api/visits?');
  }, []);

  return {
    visits,
    loading,
    pagination,
    refetch: fetchVisits,
    updateVisit,
    removeVisit,
    addVisit
  };
}
