import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to sync authentication state across browser tabs
 * @param {boolean} isAuthenticated - Whether user is logged in
 * @param {function} onLogout - Callback when logout is broadcast
 * @returns {object} - Broadcast functions
 */
export const useCrossTabs = (isAuthenticated, onLogout) => {
  const broadcastChannelRef = useRef(null);

  // Initialize BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannelRef.current = new BroadcastChannel('auth_channel');

      broadcastChannelRef.current.onmessage = (event) => {
        if (event.data.type === 'LOGOUT') {
          onLogout(event.data.message, true); // true = skip broadcast to avoid loop
        }
      };

      return () => {
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.close();
        }
      };
    }
  }, []); // Empty deps - create once

  // Broadcast logout to other tabs
  const broadcastLogout = useCallback((message) => {
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({
          type: 'LOGOUT',
          message: message || 'Your session has expired. Please log in again.'
        });
      } catch (error) {
        console.error('Broadcast logout failed:', error);
      }
    }
  }, []);

  return { broadcastLogout };
};