import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

const PROTECTED_ROUTES = ['/dashboard', '/new-post', '/edit-post'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthStatusResolved, setIsAuthStatusResolved] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const broadcastChannelRef = useRef(null);
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Cross-tab logout sync
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannelRef.current = new BroadcastChannel('auth_channel');

      broadcastChannelRef.current.onmessage = (event) => {
        if (event.data.type === 'LOGOUT') {
          handleSessionExpired(event.data.message, true); // true = skip re-broadcast
        }
      };

      return () => {
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.close();
        }
      };
    }
  }, []); // Create once

  // Re-verify session on network reconnection
  useEffect(() => {
    const handleOnline = async () => {
      if (!isAuthenticatedRef.current) return;
      console.log('Network reconnected, verifying session...');
      await verifySession();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const isProtectedRoute = useCallback((pathname) => {
    return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  }, []);

  const handleSessionExpired = useCallback(async (message, skipBroadcast = false) => {
    // Broadcast logout to other tabs
    if (!skipBroadcast && broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({
          type: 'LOGOUT',
          message: message || 'Your session has expired. Please log in again.'
        });
      } catch (error) {
        console.error('Broadcast failed:', error);
      }
    }

    // Only attempt backend logout if session may still be active
    if (isAuthenticatedRef.current) {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (error) {
        console.debug('Logout during expiration (expected if session already expired):', error.message);
      }
    }

    setUser(null);
    setIsAuthenticated(false);

    sessionStorage.setItem('loginMessage', message || 'Your session has expired. Please log in again.');

    if (isProtectedRoute(location.pathname)) {
      navigate('/login', { replace: true });
    }
  }, [navigate, location.pathname, isProtectedRoute]);

  const verifySession = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/session`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        }
      );

      if (response.status === 200) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Session verification error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsAuthStatusResolved(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  const signup = async (username, email, password, returnPath) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username, email, password }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create account');
      }

      const data = await response.json();
      setUser(data.user);
      setIsAuthenticated(true);
      navigate(returnPath || '/dashboard');
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password, returnPath, rememberMe = false) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password, rememberMe }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to login');
      }

      const data = await response.json();
      setUser(data.user);
      setIsAuthenticated(true);
      navigate(returnPath || '/dashboard');
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/logout`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      // Notify other tabs
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({ type: 'LOGOUT' });
        } catch (error) {
          console.error('Broadcast logout failed:', error);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      isAuthStatusResolved,
      signup,
      login,
      logout,
      verifySession,
      handleSessionExpired,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);