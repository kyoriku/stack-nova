import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { apiFetch } from '../../../utils/apiFetch';

export const usePosts = (searchTerm) => {
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => await apiFetch(`/posts`),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30
  });

  const filteredPosts = posts?.filter(post => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const postDate = format(parseISO(post.createdAt), 'MMMM yyyy').toLowerCase();

    const matchesPost =
      post.title.toLowerCase().includes(searchLower) ||
      post.content.toLowerCase().includes(searchLower) ||
      post.excerpt.toLowerCase().includes(searchLower) ||
      post.user.username.toLowerCase().includes(searchLower) ||
      postDate.includes(searchLower);

    const matchesComments = post.comments?.some(comment =>
      comment.comment_text.toLowerCase().includes(searchLower) ||
      comment.user.username.toLowerCase().includes(searchLower)
    ) || false;

    return matchesPost || matchesComments;
  }) || [];

  return { posts: filteredPosts, isLoading, error };
};