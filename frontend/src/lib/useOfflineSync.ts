import { useState, useEffect } from 'react';
import { getQueue, removeFromQueue } from './offlineQueue';
import { fetchWithAuth } from './api';

export function useOfflineSync() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      
      // Start sync
      setIsSyncing(true);
      try {
        const queue = await getQueue();
        if (queue.length > 0) {
          console.log(`[SYNC] Syncing ${queue.length} offline requests`);
          
          for (const req of queue) {
            try {
              // Note: If original request was FormData, we'd need to reconstruct it here
              // For now, assuming JSON or simulated multipart.
              let body = req.options.body;
              let headers = req.options.headers || {};
              
              if (req.isFormData && typeof body === 'string') {
                 // Reconstruct a simple JSON representation if it was stringified, or ideally recreate FormData
                 // Simplification for the demo:
                 body = JSON.parse(body);
                 headers = { ...headers, 'Content-Type': 'application/json' };
              }

              await fetchWithAuth(req.endpoint, {
                ...req.options,
                body: typeof body === 'object' && !(body instanceof FormData) ? JSON.stringify(body) : body,
                headers,
              });
              
              await removeFromQueue(req.id);
            } catch (err) {
              console.error(`[SYNC] Failed to sync request ${req.id}`, err);
            }
          }
          console.log('[SYNC] Sync complete');
        }
      } catch (err) {
        console.error('[SYNC] Error during queue sync', err);
      } finally {
        setIsSyncing(false);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on load just in case it came online while loading
    if (navigator.onLine) {
       handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOffline, isSyncing };
}
