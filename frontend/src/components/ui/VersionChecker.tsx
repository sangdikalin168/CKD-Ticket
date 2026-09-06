import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';

/**
 * VersionChecker Component
 * 
 * Checks for new app versions and prompts user to refresh
 * Uses service worker update detection and periodic version checks
 */
export const VersionChecker = () => {
  const { t } = useTranslation();
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // Check for updates when page loads
        registration.update();

        // Listen for new service worker installing
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[VersionChecker] New version available!');
                setUpdateAvailable(true);
              }
            });
          }
        });
      });

      // Check for updates every 5 minutes
      const interval = setInterval(() => {
        navigator.serviceWorker.ready.then(registration => {
          registration.update();
        });
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, []);

  // Also check version.json periodically
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('/version.json?t=' + Date.now(), {
          cache: 'no-store'
        });
        const data = await response.json();
        
        const currentVersion = localStorage.getItem('app_version');
        
        if (currentVersion && currentVersion !== data.version) {
          console.log('[VersionChecker] New version detected:', data.version);
          setUpdateAvailable(true);
        }
        
        localStorage.setItem('app_version', data.version);
      } catch (error) {
        console.error('[VersionChecker] Failed to check version:', error);
      }
    };

    // Check on mount
    checkVersion();

    // Check every 10 minutes
    const interval = setInterval(checkVersion, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Hard reload
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{t('ui.version.updateAvailable')}</h3>
            <p className="text-sm opacity-90 mt-1">
              {t('ui.version.updateMessage')}
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleRefresh}
                className="bg-white text-primary hover:bg-white/90"
              >
                {t('ui.version.refreshNow')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setUpdateAvailable(false)}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                {t('ui.version.later')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
