import { Link } from 'react-router-dom';
import { PlusCircle, FileText } from 'lucide-react';
import { PostItem } from './PostItem';

export const PostsList = ({ posts, onDeleteClick, prefetchPost }) => {
  if (!posts) {
    return (
      <section className="text-center py-12" aria-labelledby="loading-state">
        <h2 id="loading-state" className="sr-only">Loading posts</h2>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 dark:border-blue-400 border-r-transparent" />
        <p className="text-gray-600 dark:text-gray-400 mt-4">
          Loading posts...
        </p>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="relative bg-gradient-to-br from-white to-gray-50/50 
                        dark:from-gray-800 dark:to-gray-800/50
                        rounded-2xl p-12 text-center
                        border border-gray-200/60 dark:border-gray-700/60
                        shadow-sm shadow-gray-900/5 dark:shadow-black/20
                        overflow-hidden"
        aria-labelledby="empty-state">

        {/* Decorative gradient accent */}
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

          <h2 id="empty-state" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            No posts yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven't created any posts yet. Start sharing your knowledge!
          </p>

          <Link
            to="/new-post"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                     bg-gradient-to-r from-blue-500 to-purple-500
                     dark:from-blue-600 dark:to-purple-600
                     text-white font-semibold text-sm
                     hover:shadow-lg hover:shadow-blue-500/30 dark:hover:shadow-blue-500/40
                     hover:scale-105
                     transition-all duration-200"
          >
            <PlusCircle size={18} />
            Create your first post
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="your-posts-heading">
      <h2 id="your-posts-heading" className="sr-only">Your posts</h2>
      <ul className="list-none p-0 m-0 space-y-4" role="list">
        {posts.map((post, index) => (
          <li
            key={post.id}
            // style={{
            //   animation: 'fadeInUp 0.25s ease-out forwards',
            //   animationDelay: `${index * 0.05}s`,
            //   opacity: 0
            // }}
          >
            <PostItem
              post={post}
              onDeleteClick={onDeleteClick}
              prefetchPost={prefetchPost}
            />
          </li>
        ))}
      </ul>

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
    </section>
  );
};