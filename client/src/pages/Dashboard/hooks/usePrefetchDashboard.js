import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../utils/apiFetch';

export const usePrefetchDashboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useCallback(() => {
    if (navigator.connection && navigator.connection.saveData) return;
    if (!user?.id) return;

    let timer;
    clearTimeout(timer);
    timer = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ['userPosts', user.id],
        queryFn: async () => {
          try {
            return await apiFetch(`/posts/user/posts`);
          } catch (error) {
            console.warn('Error prefetching dashboard posts:', error);
            return null;
          }
        },
        staleTime: 1000 * 60 * 5,
        cacheTime: 1000 * 60 * 30
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [queryClient, user?.id]);
};