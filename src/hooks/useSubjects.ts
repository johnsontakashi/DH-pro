import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Chapter {
  id: number;
  name: string;
  order: number;
  description: string | null;
  subject_id: number;
  difficulty_level: string | null;  // "beginner", "intermediate", "advanced"
  estimated_minutes: number | null;  // Estimated time to complete chapter
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  category: 'core_eee' | 'supporting' | 'secondary_soft_skills';
  description: string;
  icon: string;
  chapters: Chapter[];
}

interface SubjectsResponse {
  subjects: Subject[];
  total: number;
}

/**
 * Custom hook to fetch and cache subjects data
 *
 * Benefits:
 * - Instant page loads with cached data
 * - Automatic background refetching
 * - Shared cache across all components
 * - Loading and error states management
 *
 * @returns Query object with subjects data, loading state, and error
 */
export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get<SubjectsResponse>('/subjects');
      return response.data;
    },
    // Cache for 10 minutes (data doesn't change frequently)
    staleTime: 10 * 60 * 1000,
    // Keep in cache for 30 minutes
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * Get subjects filtered by category from cached data
 */
export const useSubjectsByCategory = (category: string) => {
  const { data, isLoading, error } = useSubjects();

  const filteredSubjects = data?.subjects.filter(
    subject => subject.category === category
  ) || [];

  return {
    subjects: filteredSubjects,
    isLoading,
    error,
    total: filteredSubjects.length,
  };
};

/**
 * Custom hook to update subject name
 */
export const useUpdateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subjectId, name }: { subjectId: number; name: string }) => {
      const response = await api.put(`/subjects/${subjectId}`, { name });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate subjects query to refresh the cache
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};
