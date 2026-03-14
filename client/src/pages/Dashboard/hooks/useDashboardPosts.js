import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/apiFetch';

export const useDashboardPosts = (userId, options = {}) => {
  return useQuery({
    queryKey: ['userPosts', userId],
    queryFn: async () => await apiFetch(`/posts/user/posts`),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
    suspense: options?.suspense ?? false
  });
};