import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../utils/apiFetch';

export const useUserProfile = (username, options = {}) => {
  return useQuery({
    queryKey: ['user', username],
    queryFn: async () => await apiFetch(`/users/profile/${username}`),
    enabled: !!username,
    staleTime: 1000 * 60 * 20,
    cacheTime: 1000 * 60 * 60,
    suspense: options?.suspense ?? false
  });
};