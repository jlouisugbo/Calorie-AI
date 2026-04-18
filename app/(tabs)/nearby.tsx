import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLocationStore } from '@/store/locationStore';
import { fetchNearbyPlaces } from '@/services/places';
import type { NearbyPlace } from '@/types/places';

const DEFAULT_QUERY = 'restaurants';
const DEFAULT_RADIUS_KM = 2;
const DEFAULT_LIMIT = 10;

function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

function PlaceCard({
  place,
  origin,
}: {
  place: NearbyPlace;
  origin: { latitude: number; longitude: number };
}) {
  const km = place.location ? distanceKm(origin, place.location) : null;

  return (
    <Card className="mb-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-text-base">{place.name}</Text>
          {place.address ? (
            <Text className="text-xs text-muted mt-0.5" numberOfLines={2}>
              {place.address}
            </Text>
          ) : null}
        </View>
        {place.rating != null ? (
          <View className="items-end">
            <Text className="text-sm font-semibold text-text-base">
              {place.rating.toFixed(1)}
            </Text>
            {place.reviewsCount != null ? (
              <Text className="text-xs text-muted">{place.reviewsCount} reviews</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View className="flex-row flex-wrap gap-1.5 mt-3">
        {km != null ? <Chip>{formatDistance(km)}</Chip> : null}
        {place.priceLevel ? <Chip>{place.priceLevel}</Chip> : null}
        {place.categories.slice(0, 3).map((c) => (
          <Chip key={c}>{c}</Chip>
        ))}
      </View>

      {place.url ? (
        <TouchableOpacity
          onPress={() => place.url && void Linking.openURL(place.url)}
          className="mt-3"
          activeOpacity={0.7}
        >
          <Text className="text-sm text-primary font-medium">Open in maps</Text>
        </TouchableOpacity>
      ) : null}
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <View>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="mb-3">
          <Skeleton className="h-4 w-1/2 rounded" />
          <Skeleton className="h-3 w-3/4 rounded mt-2" />
          <View className="flex-row gap-2 mt-3">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </View>
        </Card>
      ))}
    </View>
  );
}

export default function NearbyScreen() {
  const coords = useLocationStore((s) => s.coords);
  const permissionStatus = useLocationStore((s) => s.permissionStatus);
  const requestPermission = useLocationStore((s) => s.requestPermission);
  const refreshCurrentLocation = useLocationStore((s) => s.refreshCurrentLocation);

  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async () => {
    if (!coords) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const result = await fetchNearbyPlaces({
        latitude: coords.latitude,
        longitude: coords.longitude,
        query: query.trim() || DEFAULT_QUERY,
        radiusKm: DEFAULT_RADIUS_KM,
        limit: DEFAULT_LIMIT,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setPlaces(result.places);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load places');
      setPlaces([]);
    } finally {
      if (abortRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, [coords, query]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const needsPermission = permissionStatus !== 'granted';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-3 border-b border-border">
        <Text className="text-lg font-semibold text-text-base">Nearby</Text>
        <Text className="text-xs text-muted mt-0.5">
          {coords
            ? `Around ${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`
            : needsPermission
              ? 'Location permission needed'
              : 'Locating…'}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {needsPermission ? (
          <Card className="mb-4">
            <Text className="text-base font-semibold text-text-base mb-1">
              Enable location
            </Text>
            <Text className="text-sm text-muted mb-4">
              We need your location to find food places near you.
            </Text>
            <Button onPress={() => void requestPermission()}>Enable location</Button>
          </Card>
        ) : !coords ? (
          <Card className="mb-4">
            <Text className="text-base font-semibold text-text-base mb-1">
              Finding your location…
            </Text>
            <Text className="text-sm text-muted mb-4">
              Hang tight while we grab a location fix.
            </Text>
            <Button variant="outline" onPress={() => void refreshCurrentLocation()}>
              Retry
            </Button>
          </Card>
        ) : (
          <>
            <View className="mb-4 gap-3">
              <Input
                label="Search"
                placeholder="e.g. ramen, smoothies, salads"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={() => void runSearch()}
              />
              <Button onPress={() => void runSearch()} loading={isLoading}>
                Find nearby
              </Button>
            </View>

            {error ? (
              <Card className="mb-4">
                <Text className="text-sm text-destructive mb-3">{error}</Text>
                <Button variant="outline" onPress={() => void runSearch()}>
                  Try again
                </Button>
              </Card>
            ) : null}

            {isLoading ? (
              <LoadingSkeleton />
            ) : places.length > 0 ? (
              places.map((place) => (
                <PlaceCard key={place.id} place={place} origin={coords} />
              ))
            ) : hasSearched && !error ? (
              <Card>
                <Text className="text-sm text-muted">
                  No places found. Try widening your search.
                </Text>
              </Card>
            ) : (
              <Card>
                <Text className="text-sm text-muted">
                  Tap "Find nearby" to discover food places around you.
                </Text>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
