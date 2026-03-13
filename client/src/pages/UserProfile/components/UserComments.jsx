import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { MarkdownPreview } from '../../../components/MarkdownEditor';
import { Pagination } from '../../../pages/Posts/components/Pagination';
import { ResponsiveDate } from '../../../components/ResponsiveDate';

export const UserComments = ({ comments, prefetchPost }) => {
  const ITEMS_PER_PAGE = 4;
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [expandedComments, setExpandedComments] = useState(new Set());
  const headerRef = useRef(null);
  const prevPage = useRef(1);

  useEffect(() => {
    if (prevPage.current === currentPage) {
      prevPage.current = currentPage;
      return;
    }

    prevPage.current = currentPage;

    if (!headerRef.current) return;

    const NAV_HEIGHT = document.querySelector('nav')?.offsetHeight ?? 64;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const y = headerRef.current.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
        window.scrollTo({ top: y, behavior: 'instant' });
      })
    });
  }, [currentPage]);

  const toggleComment = (commentId) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    return 0;
  });

  const paginatedComments = sortedComments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (!comments?.length) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-black bg-gradient-to-r 
                     from-gray-900 via-blue-800 to-purple-800 
                     dark:from-gray-100 dark:via-blue-300 dark:to-purple-300
                     bg-clip-text text-transparent mb-4">
          Recent Comments
        </h2>

        <div className="relative bg-gradient-to-br from-white to-gray-50/50 
                      dark:from-gray-800 dark:to-gray-800/50
                      rounded-2xl p-12 text-center
                      border border-gray-200/60 dark:border-gray-700/60
                      shadow-sm shadow-gray-900/5 dark:shadow-black/20
                      overflow-hidden">

          <div className="absolute top-0 right-0 w-32 h-32 
                        bg-gradient-to-br from-blue-500/5 to-purple-500/5
                        dark:from-blue-500/10 dark:to-purple-500/10
                        rounded-full blur-3xl -z-0" />

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 
                          rounded-full bg-gradient-to-br from-gray-100 to-gray-200
                          dark:from-gray-700 dark:to-gray-600 mb-4
                          shadow-lg shadow-gray-900/5 dark:shadow-black/20">
              <MessageSquare className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">No comments yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 ref={headerRef} className="text-2xl font-black bg-gradient-to-r 
                     from-gray-900 via-blue-800 to-purple-800 
                     dark:from-gray-100 dark:via-blue-300 dark:to-purple-300
                     bg-clip-text text-transparent">
          Recent Comments
        </h2>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
                   border-2 border-gray-200 dark:border-gray-700 
                   rounded-xl px-4 py-2 text-sm 
                   text-gray-900 dark:text-gray-100 
                   font-medium
                   focus:outline-none focus:border-blue-500 dark:focus:border-blue-400
                   focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30
                   shadow-sm shadow-gray-900/5 dark:shadow-black/20
                   transition-all duration-200 cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {paginatedComments.map((comment, index) => (
        <div
          key={comment.id}
          // style={{
          //   animation: 'fadeInUp 0.25s ease-out forwards',
          //   animationDelay: `${index * 0.05}s`,
          //   opacity: 0
          // }}
        >
          <div className="relative bg-gradient-to-br from-white to-gray-50/50 
                        dark:from-gray-800 dark:to-gray-800/50
                        rounded-2xl p-4 sm:p-6
                        border border-gray-200/60 dark:border-gray-700/60
                        shadow-sm shadow-gray-900/5 dark:shadow-black/20
                        overflow-hidden">

            <div className="relative z-10">
              {expandedComments.has(comment.id) ? (
                <div className="text-gray-900 dark:text-gray-100 mb-4 prose dark:prose-invert max-w-none">
                  <MarkdownPreview content={comment.comment_text} showLineNumbers={false} />
                  <button
                    onClick={() => toggleComment(comment.id)}
                    className="text-sm px-3 py-1 rounded-lg
                             text-blue-600 dark:text-blue-400 font-semibold
                             hover:bg-blue-50 dark:hover:bg-blue-900/20
                             cursor-pointer
                             transition-all duration-200 mt-2"
                  >
                    Show less
                  </button>
                </div>
              ) : (
                <div className="text-gray-900 dark:text-gray-100 mb-4">
                  <p className="leading-relaxed">{comment.excerpt}</p>
                  {comment.comment_text.length > comment.excerpt.length && (
                    <button
                      onClick={() => toggleComment(comment.id)}
                      className="text-sm px-3 py-1 rounded-lg
                               text-blue-600 dark:text-blue-400 font-semibold
                               hover:bg-blue-50 dark:hover:bg-blue-900/20
                               cursor-pointer
                               transition-all duration-200 mt-2"
                    >
                      Read more
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>on</span>
                <Link
                  to={`/post/${comment.post.slug}`}
                  className="font-semibold text-transparent bg-clip-text 
                           bg-gradient-to-r from-blue-600 to-purple-600
                           dark:from-blue-400 dark:to-purple-400
                           hover:from-blue-700 hover:to-purple-700
                           dark:hover:from-blue-300 dark:hover:to-purple-300
                           transition-all duration-200"
                  onMouseEnter={() => prefetchPost(comment.post.slug)}
                  onFocus={() => prefetchPost(comment.post.slug)}
                >
                  {comment.post.title}
                </Link>
                <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">•</span>
                <ResponsiveDate
                  date={comment.createdAt}
                  className="font-medium"
                />
              </div>
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 
                          bg-gradient-to-br from-blue-500/5 to-purple-500/5
                          dark:from-blue-500/10 dark:to-purple-500/10
                          rounded-full blur-3xl -z-0" />
          </div>
        </div>
      ))}

      {comments.length > ITEMS_PER_PAGE && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(comments.length / ITEMS_PER_PAGE)}
          onPageChange={setCurrentPage}
        />
      )}

      {/* <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style> */}
    </div>
  );
};