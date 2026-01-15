import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PatientsResponse {
  success: boolean;
  data: Patient[];
  pagination: PaginationData;
}

// Fetch patients function
async function fetchPatients(page: number, searchTerm: string, limit: number): Promise<PatientsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (searchTerm.trim()) {
    params.append('search', searchTerm.trim());
  }

  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`/api/patients?${params}`, {
    credentials: 'include',
    headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
  });

  if (!response.ok) {
    throw new Error('Failed to fetch patients');
  }

  return response.json();
}

// Hook for fetching patients with React Query
export function usePatients(page: number = 1, searchTerm: string = '', limit: number = 10) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['patients', page, searchTerm, limit],
    queryFn: () => fetchPatients(page, searchTerm, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => ({
      patients: data.data,
      pagination: data.pagination,
    }),
  });

  return {
    patients: query.data?.patients ?? [],
    pagination: query.data?.pagination ?? null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Mutation for adding a patient
export function useAddPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientData: Partial<Patient>) => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(patientData),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add patient');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all patient queries to refetch
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

// Mutation for updating a patient
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Patient> }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/patients/${id}`, {
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
        throw new Error(error.error || 'Failed to update patient');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all patient queries
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

// Mutation for deleting a patient
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/patients/${id}`, {
        method: 'DELETE',
        headers: {
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete patient');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all patient queries
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
