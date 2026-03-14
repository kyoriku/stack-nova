import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/apiFetch';

export const usePrefetchUserProfile = () => {
  const queryClient = useQueryClient();

  return useCallback((username) => {
    if (navigator.connection && navigator.connection.saveData) return;
    if (!username) return;

    let timer;
    clearTimeout(timer);
    timer = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ['user', username.toString()],
        queryFn: async () => {
          try {
            return await apiFetch(`/users/profile/${username}`);
          } catch (error) {
            console.warn(`Error prefetching user ${username}:`, error);
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