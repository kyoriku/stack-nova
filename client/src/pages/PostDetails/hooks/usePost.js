import { useQuery } from '@tanstack/react-query';

export const usePost = (slug) => {
  return useQuery({
    queryKey: ['post', slug],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${slug}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch post');
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30
  });
};