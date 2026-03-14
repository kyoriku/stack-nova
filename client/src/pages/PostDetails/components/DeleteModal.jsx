import { X, AlertTriangle } from 'lucide-react';

export const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm 
                  flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="relative bg-gradient-to-br from-white to-gray-50/50 
                    dark:from-gray-800 dark:to-gray-800/50
                    rounded-2xl p-6 max-w-sm w-full
                    onClick={(e) => e.stopPropagation()}
                    shadow-2xl shadow-gray-900/10 dark:shadow-black/40
                    border-2 border-gray-200/60 dark:border-gray-700/60
                    overflow-hidden">

        {/* Background gradient accent */}
        <div className="absolute top-0 right-0 w-32 h-32 
                      bg-gradient-to-br from-red-500/10 to-red-600/10
                      dark:from-red-500/20 dark:to-red-600/20
                      rounded-full blur-3xl -z-0" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full 
                            bg-red-100 dark:bg-red-900/30
                            flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Delete Comment
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 
                       dark:text-gray-400 dark:hover:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-700/50
                       rounded-lg p-1.5
                       transition-all duration-200 cursor-pointer"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            Are you sure you want to delete this comment? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl
                       bg-white dark:bg-gray-800 
                       text-gray-700 dark:text-gray-300
                       border-2 border-gray-200 dark:border-gray-700
                       hover:bg-gray-50 dark:hover:bg-gray-750
                       hover:border-gray-300 dark:hover:border-gray-600
                       font-semibold text-sm
                       transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-xl
                       bg-gradient-to-r from-red-500 to-red-600
                       hover:from-red-600 hover:to-red-700
                       text-white font-semibold text-sm
                       hover:shadow-lg hover:shadow-red-500/30
                       hover:scale-105
                       disabled:opacity-50 disabled:cursor-not-allowed 
                       disabled:hover:scale-100 disabled:hover:shadow-none
                       cursor-pointer min-w-[85px]
                       transition-all duration-200"
            >
              {isDeleting ? (
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em]" />
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};