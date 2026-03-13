const PostSkeleton = () => {
  return (
    <div
      role="status"
      aria-label="Loading post"
      className="relative bg-gradient-to-br from-white to-gray-50/50 
                dark:from-gray-800 dark:to-gray-800/50
                rounded-2xl p-4 sm:p-6
                border border-gray-200/60 dark:border-gray-700/60 
                animate-pulse 
                shadow-sm shadow-gray-900/5 dark:shadow-black/20"
    >
      <div className="space-y-4">
        {/* Title skeleton */}
        <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 
                      dark:from-gray-700 dark:to-gray-600 
                      rounded-lg w-3/4" />

        {/* Excerpt skeleton - 2 lines */}
        <div className="space-y-2">
          <div className="h-4.25 bg-gradient-to-r from-gray-200 to-gray-300 
                        dark:from-gray-700 dark:to-gray-600 
                        rounded w-full" />
          {/* <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 
                        dark:from-gray-700 dark:to-gray-600 
                        rounded w-5/6" /> */}
        </div>

        {/* Meta info skeleton */}
        <div className="flex justify-between items-center pt-1">
          <div className="flex items-center gap-3">
            <div className="h-7 bg-gradient-to-r from-gray-200 to-gray-300 
                          dark:from-gray-700 dark:to-gray-600 
                          rounded-full w-24" />
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 
                          dark:from-gray-700 dark:to-gray-600 
                          rounded w-20" />
          </div>
          <div className="h-7 bg-gradient-to-r from-blue-100 to-purple-100 
                        dark:from-blue-900/30 dark:to-purple-900/30 
                        rounded-full w-14" />
        </div>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 
                    bg-gradient-to-br from-blue-500/5 to-purple-500/5
                    dark:from-blue-500/10 dark:to-purple-500/10
                    rounded-full blur-3xl -z-0" />
    </div>
  );
};

export const PostsSkeletonLoader = ({ count = 10 }) => {
  return (
    <div
      className="space-y-6"
      aria-label={`Loading ${count} posts`}
      role="status"
    >
      {[...Array(count)].map((_, index) => (
        <PostSkeleton key={index} />
      ))}
      <div className="sr-only" aria-live="polite">Loading posts...</div>
    </div>
  );
};