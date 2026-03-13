import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { CommentItem } from './CommentItem';

export const CommentsList = ({
  comments,
  currentUserId,
  onEditComment,
  onDeleteComment,
  isEditingComment
}) => {
  const [sortBy, setSortBy] = useState('newest');

  if (!comments?.length) return null;

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    return 0;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black bg-gradient-to-r 
                     from-gray-900 via-blue-800 to-purple-800 
                     dark:from-gray-100 dark:via-blue-300 dark:to-purple-300
                     bg-clip-text text-transparent
                     flex items-center gap-2">
          <MessageSquare size={24} className="text-gray-900 dark:text-gray-100" />
          Comments
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
          aria-label="Sort comments"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      <div className="space-y-4">
        {sortedComments.map((comment, index) => (
          <div
            key={comment.id}
            // style={{
            //   animation: 'fadeInUp 0.25s ease-out forwards',
            //   animationDelay: `${index * 0.05}s`,
            //   opacity: 0
            // }}
          >
            <CommentItem
              comment={comment}
              currentUserId={currentUserId}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
              isEditingAny={isEditingComment !== null}
            />
          </div>
        ))}
      </div>

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