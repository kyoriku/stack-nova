import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SEO } from '../../components/SEO';
import GoogleLoginButton from '../../components/GoogleLoginButton';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');
  const { login, isLoading, verifySession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check for session expiration message on mount
  useEffect(() => {
    const message = sessionStorage.getItem('loginMessage');
    if (message) {
      setSessionMessage(message);
      sessionStorage.removeItem('loginMessage');
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const oauthError = urlParams.get('error');

    if (oauthError === 'oauth_failed') {
      setError('Google login failed. Please try again.');
    } else if (oauthError === 'oauth_cancelled') {
      setError('Google login was cancelled.');
    }
  }, [location]);

  useEffect(() => {
    const handleOAuthReturn = async () => {
      if (location.state?.fromOAuth || localStorage.getItem('oauth_return_path')) {
        const returnPath = localStorage.getItem('oauth_return_path');
        localStorage.removeItem('oauth_return_path');

        try {
          await verifySession();
          if (returnPath) {
            navigate(returnPath, { replace: true });
          }
        } catch (error) {
          console.error('OAuth session verification failed:', error);
        }
      }
    };

    handleOAuthReturn();
  }, [location, verifySession, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSessionMessage(''); // Clear session message when attempting login

    try {
      const from = location.state?.from || '/dashboard';
      await login(email, password, from, rememberMe);
    } catch (err) {
      setError(err.message);
    }
  };

  // Clear session message when user starts typing
  const handleInputChange = (setter) => (e) => {
    if (sessionMessage) {
      setSessionMessage('');
    }
    setter(e.target.value);
  };

  const returnPath = location.state?.from || '/dashboard';

  return (
    <>
      <SEO
        title="Log In"
        description="Sign in to your StackNova account to post questions, share solutions, and engage with the developer community."
        canonicalPath="/login"
        noIndex={true}
      />

      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black bg-gradient-to-r 
                       from-gray-900 via-blue-800 to-purple-800 
                       dark:from-gray-100 dark:via-blue-300 dark:to-purple-300
                       bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Log in to continue to StackNova
          </p>
        </div>

        {/* Session expired message */}
        {sessionMessage && (
          <div className="mb-6 p-4 rounded-2xl 
                        bg-gradient-to-br from-amber-50 to-amber-100/50
                        dark:from-amber-900/20 dark:to-amber-900/10
                        border-2 border-amber-200 dark:border-amber-800/50
                        shadow-lg shadow-amber-500/10 dark:shadow-black/20
                        animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 rounded-full 
                            bg-amber-100 dark:bg-amber-900/30
                            flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                  {sessionMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="relative bg-gradient-to-br from-white to-gray-50/50 
                      dark:from-gray-800 dark:to-gray-800/50
                      rounded-2xl p-4 sm:p-6
                      border border-gray-200/60 dark:border-gray-700/60
                      shadow-lg shadow-gray-900/5 dark:shadow-black/20
                      overflow-hidden">

          {/* Decorative gradient accent */}
          <div className="absolute top-0 right-0 w-32 h-32 
                        bg-gradient-to-br from-blue-500/5 to-purple-500/5
                        dark:from-blue-500/10 dark:to-purple-500/10
                        rounded-full blur-3xl -z-0" />

          <div className="relative z-10 space-y-6">
            {/* Google Login Button */}
            <GoogleLoginButton returnPath={returnPath} text="Log in with Google" />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gradient-to-br from-white to-gray-50/50 
                               dark:from-gray-800 dark:to-gray-800/50
                               text-gray-500 dark:text-gray-400 font-medium">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10" size={18} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={handleInputChange(setEmail)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3 rounded-xl
                           bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
                           text-gray-900 dark:text-gray-100 
                           border-2 border-gray-200 dark:border-gray-700
                           focus:outline-none focus:border-blue-500 dark:focus:border-blue-400
                           focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30
                           placeholder:text-gray-400 dark:placeholder:text-gray-500
                           transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10" size={18} />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={handleInputChange(setPassword)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-11 pr-4 py-3 rounded-xl
                           bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
                           text-gray-900 dark:text-gray-100 
                           border-2 border-gray-200 dark:border-gray-700
                           focus:outline-none focus:border-blue-500 dark:focus:border-blue-400
                           focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30
                           placeholder:text-gray-400 dark:placeholder:text-gray-500
                           transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Remember Me checkbox */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded 
                           border-2 border-gray-300 dark:border-gray-600
                           text-blue-600 dark:text-blue-500
                           bg-white dark:bg-gray-800
                           focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30
                           focus:ring-offset-0
                           transition-all duration-200 cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300
                           cursor-pointer select-none"
                >
                  Remember me for 7 days
                </label>
              </div>

              {error && (
                <div className="p-4 rounded-2xl
                              bg-gradient-to-br from-red-50 to-red-100/50
                              dark:from-red-900/20 dark:to-red-900/10
                              border-2 border-red-200 dark:border-red-800/50
                              shadow-sm shadow-red-500/10 dark:shadow-black/20"
                  role="alert">
                  <p className="text-red-700 dark:text-red-300 text-sm font-medium text-center">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl
                         bg-gradient-to-r from-blue-500 to-purple-500
                         dark:from-blue-600 dark:to-purple-600
                         text-white font-semibold
                         hover:shadow-lg hover:shadow-blue-500/30 dark:hover:shadow-blue-500/40
                         hover:scale-105
                         focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30
                         disabled:opacity-50 disabled:cursor-not-allowed
                         disabled:hover:scale-100 disabled:hover:shadow-none
                         flex items-center justify-center 
                         transition-all duration-200 cursor-pointer"
              >
                {isLoading ? (
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em]" />
                ) : (
                  'Log in'
                )}
              </button>
            </form>

            <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link
                to="/signup"
                state={location.state}
                className="font-semibold text-transparent bg-clip-text 
                         bg-gradient-to-r from-blue-600 to-purple-600
                         dark:from-blue-400 dark:to-purple-400
                         hover:from-blue-700 hover:to-purple-700
                         dark:hover:from-blue-300 dark:hover:to-purple-300
                         transition-all duration-200"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Login;