// Service Worker registration helper

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
  hasUpdate: boolean;
}

export function registerServiceWorker(onUpdateFound?: () => void): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[ServiceWorker] Service Workers are not supported in this browser.');
    return;
  }

  // Register once the window loads to avoid blocking initial render
  window.addEventListener('load', () => {
    const swUrl = '/sw.js';

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('[ServiceWorker] Registered successfully with scope:', registration.scope);

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[ServiceWorker] New content available; please refresh.');
                if (onUpdateFound) onUpdateFound();
              } else {
                console.log('[ServiceWorker] Content cached for offline use.');
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn('[ServiceWorker] Error during service worker registration:', error);
      });
  });
}

export function unregisterServiceWorker(): void {
  try {
    if (typeof window !== 'undefined') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker) {
          navigator.serviceWorker
            .getRegistrations()
            .then((registrations) => {
              for (const reg of registrations) {
                reg.unregister().catch(() => {});
              }
            })
            .catch((error) => {
              console.warn('[ServiceWorker] Error unregistering service worker:', error);
            });
        }
      } catch (swErr) {
        // Can throw SecurityError in sandboxed iframe contexts
      }

      try {
        if ('caches' in window && window.caches) {
          caches
            .keys()
            .then((keys) => {
              for (const key of keys) {
                caches.delete(key).catch(() => {});
              }
            })
            .catch((error) => {
              console.warn('[ServiceWorker] Error clearing caches:', error);
            });
        }
      } catch (cacheErr) {
        // Can throw SecurityError in sandboxed iframe contexts
      }
    }
  } catch (err) {
    console.warn('[ServiceWorker] Unregister skipped:', err);
  }
}
