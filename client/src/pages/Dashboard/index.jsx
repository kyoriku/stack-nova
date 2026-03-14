import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { usePrefetchPost } from '../Posts/hooks/usePrefetchPost';
import { useDashboardPosts } from './hooks/useDashboardPosts';
import { useDeletePost } from './hooks/useDeletePost';
import { DeleteModal } from './components/DeleteModal';
import { Header } from './components/Header';
import { PostsList } from './components/PostsList';
import { Pagination } from '../Posts/components/Pagination';
import { SEO } from '../../components/SEO';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const Dashboard = () => {
  const { user } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const prefetchPost = usePrefetchPost();
  const queryClient = useQueryClient();

  const prefetchedData = queryClient.getQueryData(['userPosts', user?.id]);

  const { data: posts, error, refetch } = useDashboardPosts(user?.id, {
    suspense: !prefetchedData
  });

  const { deletePostMutation } = useDeletePost({
    userId: user?.id,
    onSuccess: () => {
      const newTotalItems = posts.length - 1;
      const newTotalPages = Math.ceil(newTotalItems / ITEMS_PER_PAGE);

      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      } else if (newTotalPages === 0) {
        setCurrentPage(1);
      }

      refetch();
      setDeleteModalOpen(false);
      setPostToDelete(null);
    }
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [user?.id]);

  useEffect(() => {
    if (deleteModalOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
    }
  }, [deleteModalOpen]);

  const handleDeleteClick = (post) => {
    setPostToDelete(post);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (postToDelete) {
      deletePostMutation.mutate(postToDelete.slug);
    }
  };

  const totalPages = posts ? Math.ceil(posts.length / ITEMS_PER_PAGE) : 0;
  const paginatedPosts = posts ? posts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  ) : null;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <section
          aria-label="Error message"
          className="p-6 rounded-2xl 
                   bg-gradient-to-br from-red-50 to-red-100/50
                   dark:from-red-900/20 dark:to-red-900/10
                   border-2 border-red-200 dark:border-red-800/50
                   shadow-lg shadow-red-500/10 dark:shadow-black/20"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full 
                          bg-red-100 dark:bg-red-900/30
                          flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-red-900 dark:text-red-200 mb-1">
                Error loading dashboard
              </h2>
              <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                {error.message}
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Dashboard"
        description="Manage your posts and activity on StackNova."
        canonicalPath="/dashboard"
        noIndex={true}
      />

      <div className="max-w-4xl mx-auto pb-8" id="dashboard-content">
        <DeleteModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          isDeleting={deletePostMutation.isPending}
          itemName={postToDelete?.title}
          itemType="Post"
        />

        <Header username={user?.username} />

        <PostsList
          posts={paginatedPosts}
          onDeleteClick={handleDeleteClick}
          prefetchPost={prefetchPost}
        />

        {posts && posts.length > ITEMS_PER_PAGE && (
          <nav aria-label="Pagination" className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </nav>
        )}
      </div>
    </>
  );
};

export default Dashboard;