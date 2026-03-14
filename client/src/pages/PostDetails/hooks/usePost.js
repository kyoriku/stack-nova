import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/apiFetch';

export const usePost = (slug) => {
  return useQuery({
    queryKey: ['post', slug],
    queryFn: async () => await apiFetch(`/posts/${slug}`),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30
  });
};