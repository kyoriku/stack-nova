import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotFound from '../NotFound';
import { usePost } from './hooks/usePost';
import { useComments } from './hooks/useComments';
import { DeleteModal } from './components/DeleteModal';
import { PostContent } from './components/PostContent';
import { CommentForm } from './components/CommentForm';
import { CommentsList } from './components/CommentsList';
import { SEO } from '../../components/SEO';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn } from 'lucide-react';

const PostDetails = () => {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const { data: post, isLoading, error, isError } = usePost(slug);
  const {
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
  } = useComments(slug);

  // Effect to handle body scroll lock when modal is open
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

  useEffect(() => {
    const isFromEdit = location.state?.fromEdit;
    if (isFromEdit) {
      queryClient.invalidateQueries({ queryKey: ['post', slug] });
    }
  }, [slug, location.state, queryClient]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setCommentError(''); // Clear previous errors

    // Client-side validation
    if (commentText.trim().length < 2) {
      setCommentError('Comment must be at least 2 characters');
      return;
    }

    if (commentText.length > 7500) {
      setCommentError('Comment must be less than 7500 characters');
      return;
    }

    if (editingCommentId) {
      editCommentMutation.mutate({
        commentId: editingCommentId,
        updatedText: commentText
      }, {
        onSuccess: () => {
          setCommentText('');
          setCommentError('');
        },
        onError: (error) => {
          const message = error.response?.data?.errors?.[0]?.msg ||
            'Failed to update comment. Please try again.';
          setCommentError(message);
        }
      });
    } else {
      addCommentMutation.mutate({
        comment_text: commentText,
        post_id: post.id
      }, {
        onSuccess: () => {
          setCommentText('');
          setCommentError('');
        },
        onError: (error) => {
          const message = error.response?.data?.errors?.[0]?.msg ||
            'Failed to post comment. Please try again.';
          setCommentError(message);
        }
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setCommentText('');
    setCommentError('');
  };

  const handleCommentEdit = (comment) => {
    handleEditClick(comment);
    setCommentText(comment.comment_text);
    setCommentError('');
  };

  // Generate enhanced JSON-LD for the blog post
  const generateJsonLd = (post) => {
    if (!post) return null;

    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "image": "https://stacknova.ca/screenshots/2-StackNova-Question.jpg",
      "datePublished": post.createdAt,
      "dateModified": post.updatedAt || post.createdAt,
      "author": {
        "@type": "Person",
        "name": post.user.username,
        "url": `https://stacknova.ca/user/${post.user.username}`,
      },
      "publisher": {
        "@type": "Organization",
        "name": "StackNova",
        "logo": {
          "@type": "ImageObject",
          "url": "https://stacknova.ca/favicon.svg"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://stacknova.ca/post/${post.slug}`
      },
      "commentCount": post.comments?.length || 0,
      "comment": post.comments?.map(comment => ({
        "@type": "Comment",
        "text": comment.comment_text,
        "dateCreated": comment.createdAt,
        "author": {
          "@type": "Person",
          "name": comment.user.username
        }
      })) || []
    };
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading post..." />;
  }

  if (isError || !post) {
    return (
      <NotFound
        title="Post not found"
        message={`The post "${slug}" does not exist or could not be found.`}
        linkText="Browse all posts"
        linkTo="/"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <SEO
        title={post.title}
        description={post.excerpt || `A question by ${post.user.username} on StackNova`}
        canonicalPath={`/post/${post.slug}`}
        type="article"
        image="https://stacknova.ca/screenshots/2-StackNova-Question.jpg"
        jsonLd={generateJsonLd(post)}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => deleteCommentMutation.mutate(commentToDelete?.id)}
        isDeleting={deleteCommentMutation.isPending}
      />

      <PostContent post={post} />

      {isAuthenticated ? (
        <CommentForm
          commentText={commentText}
          setCommentText={setCommentText}
          isEditing={!!editingCommentId}
          onSubmit={handleSubmit}
          onCancelEdit={handleCancelEdit}
          isSubmitting={addCommentMutation.isPending || editCommentMutation.isPending}
          error={commentError}
        />
      ) : (
        <div className="mb-8 relative bg-gradient-to-br from-white to-blue-50/50 
                      dark:from-gray-800 dark:to-gray-800/50
                      rounded-2xl p-4 sm:p-6 text-center 
                      border border-gray-200/60 dark:border-gray-700/60
                      shadow-sm shadow-gray-900/5 dark:shadow-black/20
                      overflow-hidden">

          {/* Background gradient accent */}
          <div className="absolute top-0 right-0 w-32 h-32 
                        bg-gradient-to-br from-blue-500/10 to-purple-500/10
                        dark:from-blue-500/20 dark:to-purple-500/20
                        rounded-full blur-3xl -z-0" />

          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full 
                          bg-gradient-to-br from-blue-100 to-purple-100
                          dark:from-blue-900/30 dark:to-purple-900/30
                          flex items-center justify-center">
              <LogIn className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-gray-900 dark:text-gray-100">
              You must be logged in to comment.{' '}
              <Link
                to="/login"
                state={{ from: location.pathname }}
                className="font-semibold text-transparent bg-clip-text 
                         bg-gradient-to-r from-blue-600 to-purple-600
                         dark:from-blue-400 dark:to-purple-400
                         hover:from-blue-700 hover:to-purple-700
                         dark:hover:from-blue-300 dark:hover:to-purple-300
                         transition-all duration-200"
              >
                Log in here.
              </Link>
            </p>
          </div>
        </div>
      )}

      <CommentsList
        comments={post.comments}
        currentUserId={user?.id}
        onEditComment={handleCommentEdit}
        onDeleteComment={handleDeleteClick}
        isEditingComment={editingCommentId}
      />
    </div>
  );
};

export default PostDetails;