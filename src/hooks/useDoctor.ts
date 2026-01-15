import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Doctor {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone?: string;
  clinic_name?: string;
  clinic_address?: string;
}

// Fetch doctor profile
async function fetchDoctorProfile(userId: string): Promise<Doctor> {
  const { data, error } = await supabase
    .from('doctors')
    .select('id, first_name, middle_name, last_name, email, phone, clinic_name, clinic_address')
    .eq('id', userId)
    .single();
  
  if (error) {
    throw error;
  }
  
  if (!data) {
    throw new Error('Doctor profile not found');
  }
  
  return data;
}

// Hook for fetching doctor profile with React Query
export function useDoctor(userId: string | null) {
  const query = useQuery({
    queryKey: ['doctor', userId],
    queryFn: () => fetchDoctorProfile(userId!),
    enabled: !!userId, // Only fetch if userId exists
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  return {
    doctor: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Mutation for updating doctor profile
export function useUpdateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data }: { userId: string; data: Partial<Doctor> }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      return response.json();
    },
    onSuccess: (_, { userId }) => {
      // Invalidate the doctor query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['doctor', userId] });
    },
  });
}
