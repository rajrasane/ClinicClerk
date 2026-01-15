import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface VisitsResponse {
  success: boolean;
  data: Visit[];
  pagination: PaginationData;
}

// Fetch visits function
async function fetchVisits(
  page: number,
  searchQuery: string,
  dateRange: { startDate: string; endDate: string },
  limit: number
): Promise<VisitsResponse> {
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

  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`/api/visits?${params}`, {
    credentials: 'include',
    headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
  });

  if (!response.ok) {
    throw new Error('Failed to fetch visits');
  }

  return response.json();
}

// Hook for fetching visits with React Query
export function useVisits(
  page: number = 1,
  searchQuery: string = '',
  dateRange: { startDate: string; endDate: string } = { startDate: '', endDate: '' },
  limit: number = 5
) {
  const query = useQuery({
    queryKey: ['visits', page, searchQuery, dateRange.startDate, dateRange.endDate, limit],
    queryFn: () => fetchVisits(page, searchQuery, dateRange, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => ({
      visits: data.data,
      pagination: data.pagination,
    }),
  });

  return {
    visits: query.data?.visits ?? [],
    pagination: query.data?.pagination ?? null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Mutation for adding a visit
export function useAddVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visitData: Partial<Visit>) => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(visitData),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add visit');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate visits and patients queries to refetch
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] }); // Update patient visit counts
    },
  });
}

// Mutation for updating a visit
export function useUpdateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Visit> }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/visits/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(updates),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update visit');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
}

// Mutation for deleting a visit
export function useDeleteVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/visits/${id}`, {
        method: 'DELETE',
        headers: {
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete visit');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] }); // Update patient visit counts
    },
  });
}
