
import { useOfflineSync } from '../lib/useOfflineSync';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
  const { isOffline, isSyncing } = useOfflineSync();
  const { t } = useTranslation();

  if (!isOffline && !isSyncing) return null;

  return (
    <div className={`fixed top-0 left-0 w-full z-50 text-center py-2 px-4 font-medium shadow-md transition-colors ${isOffline ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`} role="alert" aria-live="assertive">
      {isOffline ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.168a2 2 0 11-2.829-2.83m0 0l-5.656-5.656m15.556 15.556L3.434 3.434" /></svg>
          <span>{t('You are offline. Requests will be saved and sent when online.') || 'You are offline. Requests will be saved and sent when online.'}</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <span>{t('Back online! Syncing saved requests...') || 'Back online! Syncing saved requests...'}</span>
        </div>
      )}
    </div>
  );
}
