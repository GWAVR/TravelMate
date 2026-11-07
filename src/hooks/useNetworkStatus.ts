import { useState, useEffect, useCallback } from 'react';
import {
  getSimulatedOffline,
  setSimulatedOffline,
  getCacheDiagnostics,
  CacheDiagnostics,
} from '../utils/offlineStorage';

export function useNetworkStatus() {
  const [isRealOnline, setIsRealOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [isSimulatedOffline, setIsSimulatedOfflineState] = useState<boolean>(() => {
    return getSimulatedOffline();
  });

  const [diagnostics, setDiagnostics] = useState<CacheDiagnostics>(() => {
    return getCacheDiagnostics();
  });

  const refreshDiagnostics = useCallback(() => {
    setDiagnostics(getCacheDiagnostics());
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsRealOnline(true);
      refreshDiagnostics();
    };

    const handleOffline = () => {
      setIsRealOnline(false);
      refreshDiagnostics();
    };

    const handleOfflineToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOffline: boolean }>;
      if (customEvent.detail) {
        setIsSimulatedOfflineState(customEvent.detail.isOffline);
      } else {
        setIsSimulatedOfflineState(getSimulatedOffline());
      }
      refreshDiagnostics();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('travelmate_offline_toggle', handleOfflineToggle);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('travelmate_offline_toggle', handleOfflineToggle);
    };
  }, [refreshDiagnostics]);

  const toggleSimulatedOffline = useCallback(() => {
    const nextVal = !isSimulatedOffline;
    setSimulatedOffline(nextVal);
    setIsSimulatedOfflineState(nextVal);
    refreshDiagnostics();
  }, [isSimulatedOffline, refreshDiagnostics]);

  // Effective online status
  const isOnline = isRealOnline && !isSimulatedOffline;

  return {
    isOnline,
    isRealOnline,
    isSimulatedOffline,
    toggleSimulatedOffline,
    diagnostics,
    refreshDiagnostics,
  };
}
