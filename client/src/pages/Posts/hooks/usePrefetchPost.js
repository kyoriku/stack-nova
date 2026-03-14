import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/apiFetch';

export const usePrefetchPost = () => {
  const queryClient = useQueryClient();

  return useCallback((postSlug) => {
    if (navigator.connection && navigator.connection.saveData) return;
    if (!postSlug) return;
    if (queryClient.getQueryData(['post', postSlug.toString()])) return;

    let timer;
    clearTimeout(timer);
    timer = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ['post', postSlug.toString()],
        queryFn: async () => {
          try {
            return await apiFetch(`/posts/${postSlug}`);
          } catch (error) {
            console.warn(`Error prefetching post ${postSlug}:`, error);
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