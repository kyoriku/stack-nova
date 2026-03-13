import { useState, useEffect, useRef } from 'react';
import { PostItem } from '../../../pages/Posts/components/PostItem';
import { Pagination } from '../../../pages/Posts/components/Pagination';
import { FileText } from 'lucide-react';

export const UserPosts = ({ posts, prefetchPost }) => {
  const ITEMS_PER_PAGE = 4;
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
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

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    return 0;
  });

  const paginatedPosts = sortedPosts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (!posts?.length) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-black bg-gradient-to-r 
                     from-gray-900 via-blue-800 to-purple-800 
                     dark:from-gray-100 dark:via-blue-300 dark:to-purple-300
                     bg-clip-text text-transparent mb-4">
          Recent Posts
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
              <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">No posts yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 ref={headerRef} className="text-2xl font-black bg-gradient-to-r 
                     from-gray-900 via-blue-800 to-purple-800 
                     dark:from-gray-100 dark:via-blue-300 dark:to-purple-300
                     bg-clip-text text-transparent">
          Recent Posts
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

      {paginatedPosts.map((post, index) => (
        <div
          key={post.id}
          // style={{
          //   animation: 'fadeInUp 0.25s ease-out forwards',
          //   animationDelay: `${index * 0.05}s`,
          //   opacity: 0
          // }}
        >
          <PostItem post={post} prefetchPost={prefetchPost} />
        </div>
      ))}

      {posts.length > ITEMS_PER_PAGE && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(posts.length / ITEMS_PER_PAGE)}
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