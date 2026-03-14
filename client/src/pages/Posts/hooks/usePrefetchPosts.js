import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/apiFetch';

export const usePrefetchPosts = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    if (navigator.connection && navigator.connection.saveData) return;

    let timer;
    clearTimeout(timer);
    timer = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ['posts'],
        queryFn: async () => {
          try {
            return await apiFetch(`/posts`);
          } catch (error) {
            console.warn('Error prefetching posts:', error);
            return null;
          }
        },
        staleTime: 1000 * 60 * 5,
        cacheTime: 1000 * 60 * 30
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [queryClient]);
};