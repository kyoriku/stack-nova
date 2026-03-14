import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../utils/apiFetch';

export const usePostData = (postSlug) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postSlug],
    queryFn: async () => await apiFetch(`/posts/${postSlug}`),
    onError: (error) => setError(error.message)
  });

  useEffect(() => {
    if (post && user && post.user_id !== user.id) {
      navigate('/dashboard');
    }
  }, [post, user, navigate]);

  return { post, isLoading, error };
};