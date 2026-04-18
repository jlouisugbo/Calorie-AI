import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export type LocationPermissionStatus = 'unknown' | 'granted' | 'denied' | 'restricted';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

interface LocationState {
  permissionStatus: LocationPermissionStatus;
  coords: LocationCoords | null;
  isLoading: boolean;
  isWatching: boolean;
  error: string | null;
  hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  requestPermission: () => Promise<LocationPermissionStatus>;
  refreshCurrentLocation: () => Promise<LocationCoords | null>;
  startWatching: () => Promise<void>;
  stopWatching: () => void;
  clearError: () => void;
}

let watchSubscription: Location.LocationSubscription | null = null;

function mapPermissionStatus(
  status: Location.PermissionStatus,
): LocationPermissionStatus {
  switch (status) {
    case Location.PermissionStatus.GRANTED:
      return 'granted';
    case Location.PermissionStatus.DENIED:
      return 'denied';
    default:
      return 'unknown';
  }
}

function toCoords(location: Location.LocationObject): LocationCoords {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? null,
    timestamp: location.timestamp,
  };
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      permissionStatus: 'unknown',
      coords: null,
      isLoading: false,
      isWatching: false,
      error: null,
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      clearError: () => set({ error: null }),

      requestPermission: async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          const mapped = mapPermissionStatus(status);
          set({ permissionStatus: mapped, error: null });
          return mapped;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to request location permission';
          set({ error: message });
          return 'denied';
        }
      },

      refreshCurrentLocation: async () => {
        set({ isLoading: true, error: null });
        try {
          let status = get().permissionStatus;
          if (status !== 'granted') {
            status = await get().requestPermission();
          }
          if (status !== 'granted') {
            set({ isLoading: false });
            return null;
          }

          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const coords = toCoords(location);
          set({ coords, isLoading: false });
          return coords;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to fetch current location';
          set({ isLoading: false, error: message });
          return null;
        }
      },

      startWatching: async () => {
        if (get().isWatching || watchSubscription) return;

        let status = get().permissionStatus;
        if (status !== 'granted') {
          status = await get().requestPermission();
        }
        if (status !== 'granted') return;

        try {
          set({ isWatching: true, error: null });
          watchSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 15000,
              distanceInterval: 25,
            },
            (location) => {
              set({ coords: toCoords(location) });
            },
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Failed to watch location';
          set({ isWatching: false, error: message });
          if (watchSubscription) {
            watchSubscription.remove();
            watchSubscription = null;
          }
        }
      },

      stopWatching: () => {
        if (watchSubscription) {
          watchSubscription.remove();
          watchSubscription = null;
        }
        if (get().isWatching) {
          set({ isWatching: false });
        }
      },
    }),
    {
      name: 'calai.location',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        permissionStatus: state.permissionStatus,
        coords: state.coords,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
