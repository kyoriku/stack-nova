import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../utils/apiFetch';

export const useComments = (postSlug) => {
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const addCommentMutation = useMutation({
    mutationFn: async (newComment) => await apiFetch(`/comments`, {
      method: 'POST',
      body: JSON.stringify(newComment)
    }),
    onSuccess: async () => {
      if (user?.username) {
        queryClient.removeQueries({ queryKey: ['user', user.username] });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['posts'] }),
        queryClient.invalidateQueries({ queryKey: ['post', postSlug] }),
        queryClient.invalidateQueries({ queryKey: ['user'], exact: false, refetchType: 'active' })
      ]);
    }
  });

  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, updatedText }) => await apiFetch(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ comment_text: updatedText })
    }),
    onSuccess: async () => {
      if (user?.username) {
        queryClient.removeQueries({ queryKey: ['user', user.username] });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['posts'] }),
        queryClient.invalidateQueries({ queryKey: ['post', postSlug] }),
        queryClient.invalidateQueries({ queryKey: ['user'], exact: false, refetchType: 'active' })
      ]);
      setEditingCommentId(null);
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => apiFetch(`/comments/${commentId}`, {
      method: 'DELETE',
    }),
    onSuccess: async () => {
      if (user?.username) {
        queryClient.removeQueries({ queryKey: ['user', user.username] });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['posts'] }),
        queryClient.invalidateQueries({ queryKey: ['post', postSlug] }),
        queryClient.invalidateQueries({ queryKey: ['user'], exact: false, refetchType: 'active' })
      ]);
      setDeleteModalOpen(false);
      setCommentToDelete(null);
    }
  });

  const handleEditClick = (comment) => {
    setEditingCommentId(comment.id);
    setTimeout(() => {
      document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDeleteClick = (comment) => {
    setCommentToDelete(comment);
    setDeleteModalOpen(true);
  };

  return {
    editingCommentId,
    setEditingCommentId,
    deleteModalOpen,
    setDeleteModalOpen,
    commentToDelete,
    addCommentMutation,
    editCommentMutation,
    deleteCommentMutation,
    handleEditClick,
    handleDeleteClick
  };
};