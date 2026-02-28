const Footer = () => {
  return (
    <footer className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
                     border-t border-gray-200/60 dark:border-gray-700/60 
                     mt-auto shadow-sm dark:shadow-md dark:shadow-black/10
                     overflow-hidden">
      
      {/* Decorative gradient accents */}
      <div className="absolute top-0 left-1/4 w-32 h-32 
                    bg-gradient-to-br from-blue-500/5 to-purple-500/5
                    dark:from-blue-500/10 dark:to-purple-500/10
                    rounded-full blur-3xl -z-0" />
      <div className="absolute top-0 right-1/4 w-32 h-32 
                    bg-gradient-to-br from-purple-500/5 to-blue-500/5
                    dark:from-purple-500/10 dark:to-blue-500/10
                    rounded-full blur-3xl -z-0" />
      
      <div className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex flex-col items-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            © {new Date().getFullYear()}{' '}
            <span className="font-bold bg-gradient-to-r 
                           from-gray-900 via-blue-800 to-purple-800 
                           dark:from-gray-100 dark:via-blue-300 dark:to-purple-300
                           bg-clip-text text-transparent">
              StackNova
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;