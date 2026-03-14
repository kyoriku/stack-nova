import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../utils/apiFetch';

export const useDeletePost = ({ userId, onSuccess }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const deletePostMutation = useMutation({
    mutationFn: async (postSlug) => apiFetch(`/posts/${postSlug}`, {
      method: 'DELETE',
    }),
    onSuccess: async (_, postSlug) => {
      queryClient.removeQueries({ queryKey: ['post', postSlug], exact: true });

      const currentPosts = queryClient.getQueryData(['userPosts', userId]) || [];
      if (Array.isArray(currentPosts)) {
        queryClient.setQueryData(['userPosts', userId],
          currentPosts.filter(post => post.slug !== postSlug)
        );
      }

      if (user?.username) {
        queryClient.setQueryData(['user', user.username], (oldData) => {
          if (!oldData || !oldData.posts) return oldData;
          return {
            ...oldData,
            posts: oldData.posts.filter(post => post.slug !== postSlug)
          };
        });
      }

      const allPosts = queryClient.getQueryData(['posts']) || [];
      if (Array.isArray(allPosts)) {
        queryClient.setQueryData(['posts'],
          allPosts.filter(post => post.slug !== postSlug)
        );
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user'], exact: false }),
        queryClient.invalidateQueries({ queryKey: ['posts'] }),
        ...(user?.username ? [queryClient.invalidateQueries({ queryKey: ['user', user.username] })] : [])
      ]);

      if (onSuccess) onSuccess();
    }
  });

  return { deletePostMutation };
};