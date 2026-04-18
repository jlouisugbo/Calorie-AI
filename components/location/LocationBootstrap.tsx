import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useLocationStore } from '@/store/locationStore';

export function LocationBootstrap() {
  const hasHydrated = useLocationStore((s) => s.hasHydrated);
  const permissionStatus = useLocationStore((s) => s.permissionStatus);
  const startWatching = useLocationStore((s) => s.startWatching);
  const stopWatching = useLocationStore((s) => s.stopWatching);
  const requestPermission = useLocationStore((s) => s.requestPermission);
  const refreshCurrentLocation = useLocationStore((s) => s.refreshCurrentLocation);

  const didInitialize = useRef(false);

  useEffect(() => {
    if (!hasHydrated || didInitialize.current) return;
    didInitialize.current = true;

    (async () => {
      let status = permissionStatus;
      if (status === 'unknown') {
        status = await requestPermission();
      }
      if (status === 'granted') {
        await refreshCurrentLocation();
        await startWatching();
      }
    })();
  }, [
    hasHydrated,
    permissionStatus,
    requestPermission,
    refreshCurrentLocation,
    startWatching,
  ]);

  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        if (useLocationStore.getState().permissionStatus === 'granted') {
          void useLocationStore.getState().startWatching();
        }
      } else {
        useLocationStore.getState().stopWatching();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      stopWatching();
    };
  }, [stopWatching]);

  return null;
}
