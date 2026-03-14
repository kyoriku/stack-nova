import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { POST_LIMITS } from '../../NewPost/constants';
import { validateCodeBlocks } from '../../NewPost/utils';
import { apiFetch } from '../../../utils/apiFetch';

export const useUpdatePost = (postSlug) => {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const updatePostMutation = useMutation({
    mutationFn: async (updatedPost) => await apiFetch(`/posts/${postSlug}`, {
      method: 'PUT',
      body: JSON.stringify(updatedPost)
    }),
    onMutate: async (updatedPostData) => {
      await queryClient.cancelQueries({ queryKey: ['post', postSlug] });
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      await queryClient.cancelQueries({ queryKey: ['userPosts', user?.id] });
      if (user?.username) {
        await queryClient.cancelQueries({ queryKey: ['user', user.username] });
      }

      const previousPost = queryClient.getQueryData(['post', postSlug]);
      const previousPosts = queryClient.getQueryData(['posts']);
      const previousUserPosts = queryClient.getQueryData(['userPosts', user?.id]);
      const previousUserProfile = user?.username ? queryClient.getQueryData(['user', user.username]) : null;

      const optimisticPost = {
        ...previousPost,
        title: updatedPostData.title,
        content: updatedPostData.content,
        excerpt: updatedPostData.content.substring(0, 150) + '...',
        updatedAt: new Date().toISOString()
      };

      queryClient.setQueryData(['post', postSlug], optimisticPost);

      if (Array.isArray(previousPosts)) {
        queryClient.setQueryData(['posts'], previousPosts.map(post =>
          (post.slug === postSlug || post.id === previousPost?.id) ? optimisticPost : post
        ));
      }
      if (Array.isArray(previousUserPosts)) {
        queryClient.setQueryData(['userPosts', user?.id], previousUserPosts.map(post =>
          (post.slug === postSlug || post.id === previousPost?.id) ? optimisticPost : post
        ));
      }
      if (user?.username && previousUserProfile) {
        queryClient.setQueryData(['user', user.username], {
          ...previousUserProfile,
          posts: previousUserProfile.posts?.map(post =>
            (post.slug === postSlug || post.id === previousPost?.id) ? optimisticPost : post
          ) || []
        });
      }

      return { previousPost, previousPosts, previousUserPosts, previousUserProfile };
    },
    onError: (err, updatedPostData, context) => {
      if (context?.previousPost) queryClient.setQueryData(['post', postSlug], context.previousPost);
      if (context?.previousPosts) queryClient.setQueryData(['posts'], context.previousPosts);
      if (context?.previousUserPosts) queryClient.setQueryData(['userPosts', user?.id], context.previousUserPosts);
      if (context?.previousUserProfile && user?.username) {
        queryClient.setQueryData(['user', user.username], context.previousUserProfile);
      }
      setError(err.message);
    },
    onSuccess: async (data) => {
      const newSlug = data.post?.slug || postSlug;
      const realPost = data.post;

      queryClient.setQueryData(['post', newSlug], realPost);
      if (newSlug !== postSlug) {
        queryClient.removeQueries({ queryKey: ['post', postSlug] });
      }

      queryClient.setQueryData(['posts'], (oldPosts) => {
        if (!Array.isArray(oldPosts)) return oldPosts;
        return oldPosts.map(post => (post.slug === postSlug || post.id === realPost?.id) ? realPost : post);
      });

      queryClient.setQueryData(['userPosts', user?.id], (oldPosts) => {
        if (!Array.isArray(oldPosts)) return oldPosts;
        return oldPosts.map(post => (post.slug === postSlug || post.id === realPost?.id) ? realPost : post);
      });

      if (user?.username) {
        queryClient.setQueryData(['user', user.username], (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            posts: oldData.posts?.map(post => (post.slug === postSlug || post.id === realPost?.id) ? realPost : post) || []
          };
        });
      }

      navigate(`/post/${newSlug}`, { replace: true });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts', user?.id] });
      if (user?.username) {
        queryClient.invalidateQueries({ queryKey: ['user', user.username] });
      }
    }
  });

  const handleUpdatePost = (postData) => {
    setError('');

    if (!postData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (postData.title.trim().length > POST_LIMITS.TITLE_MAX) {
      setError(`Title must be less than ${POST_LIMITS.TITLE_MAX} characters`);
      return;
    }
    if (!postData.content.trim()) {
      setError('Content is required');
      return;
    }
    if (postData.content.trim().length < POST_LIMITS.CONTENT_MIN) {
      setError(`Content must be at least ${POST_LIMITS.CONTENT_MIN} characters`);
      return;
    }
    if (postData.content.trim().length > POST_LIMITS.CONTENT_MAX) {
      setError(`Content must be less than ${POST_LIMITS.CONTENT_MAX} characters`);
      return;
    }
    if (!validateCodeBlocks(postData.content)) {
      setError(`Code blocks must be less than ${POST_LIMITS.CODE_BLOCK_MAX} characters`);
      return;
    }

    updatePostMutation.mutate(postData);
  };

  return {
    error,
    isUpdating: updatePostMutation.isPending,
    updatePost: handleUpdatePost,
    clearError: () => setError('')
  };
};