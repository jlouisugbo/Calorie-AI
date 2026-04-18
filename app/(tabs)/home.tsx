import { useEffect } from 'react';
import { Text, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'expo-router';
import { useLocationStore } from '@/store/locationStore';
import { useCalendarStore } from '@/store/calendarStore';
import { BiomarkersCard } from '@/components/profile/BiomarkersCard';

function formatCoord(value: number) {
  return value.toFixed(5);
}

function formatTimestamp(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return '—';
  }
}

function formatEventTime(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function LocationCard() {
  const permissionStatus = useLocationStore((s) => s.permissionStatus);
  const coords = useLocationStore((s) => s.coords);
  const isLoading = useLocationStore((s) => s.isLoading);
  const isWatching = useLocationStore((s) => s.isWatching);
  const error = useLocationStore((s) => s.error);
  const requestPermission = useLocationStore((s) => s.requestPermission);
  const refreshCurrentLocation = useLocationStore((s) => s.refreshCurrentLocation);

  const needsPermission = permissionStatus !== 'granted';

  return (
    <Card className="mb-4">
      <Text className="text-lg font-semibold text-text-base mb-1">Your location</Text>
      <Text className="text-sm text-muted mb-4">
        {needsPermission
          ? 'We use your location to personalize nearby recommendations. It stays on-device.'
          : isWatching
            ? 'Live updates are active while the app is open.'
            : 'Location is available but not currently watching.'}
      </Text>

      {coords ? (
        <View className="mb-4">
          <Text className="text-sm font-mono text-text-base">
            {formatCoord(coords.latitude)}, {formatCoord(coords.longitude)}
          </Text>
          <Text className="text-xs text-muted mt-1">
            {coords.accuracy != null ? `±${Math.round(coords.accuracy)}m · ` : ''}
            Updated {formatTimestamp(coords.timestamp)}
          </Text>
        </View>
      ) : (
        <Text className="text-sm text-muted mb-4">
          {permissionStatus === 'denied'
            ? 'Location permission was denied. Enable it in Settings to get personalized suggestions.'
            : 'No location yet.'}
        </Text>
      )}

      {error ? <Text className="text-xs text-destructive mb-2">{error}</Text> : null}

      {needsPermission ? (
        <Button onPress={() => void requestPermission()} loading={isLoading}>
          Enable location
        </Button>
      ) : (
        <Button
          variant="outline"
          onPress={() => void refreshCurrentLocation()}
          loading={isLoading}
        >
          Refresh location
        </Button>
      )}
    </Card>
  );
}

function NextEventCard() {
  const events = useCalendarStore((s) => s.events);
  const isLoading = useCalendarStore((s) => s.isLoading);
  const refresh = useCalendarStore((s) => s.refresh);
  const router = useRouter();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const next = events[0] ?? null;

  return (
    <Card className="mb-4">
      <Text className="text-lg font-semibold text-text-base mb-1">Next on your calendar</Text>
      {next ? (
        <View className="mb-4">
          <Text className="text-base text-text-base">{next.summary ?? '(no title)'}</Text>
          <Text className="text-xs text-muted mt-1">
            {formatEventTime(next.start)}
            {next.location ? ` · ${next.location}` : ''}
          </Text>
        </View>
      ) : (
        <Text className="text-sm text-muted mb-4">
          {isLoading ? 'Checking…' : 'No upcoming events. Connect Google Calendar to plan around your day.'}
        </Text>
      )}
      <Button variant="outline" onPress={() => router.push('/(tabs)/calendar')}>
        Open calendar
      </Button>
    </Card>
  );
}

function CoachCard() {
  const router = useRouter();
  return (
    <Card className="mb-4">
      <Text className="text-lg font-semibold text-text-base mb-1">Talk to your coach</Text>
      <Text className="text-sm text-muted mb-4">
        Hold the orb and ask anything — "what should I eat near LAX?" or "snack
        before my 4pm?"
      </Text>
      <View className="flex-row gap-2">
        <Button onPress={() => router.push('/(tabs)/voice')}>Voice</Button>
        <Button variant="outline" onPress={() => router.push('/(tabs)/chat')}>
          Text chat
        </Button>
      </View>
    </Card>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingVertical: 24 }}>
        <Text className="text-4xl font-display text-text-base mb-2">Calorie-AI</Text>
        <Text className="text-base font-sans text-muted mb-8">
          Your context-aware nutrition agent
        </Text>

        <CoachCard />
        <BiomarkersCard className="mb-4" compact />
        <NextEventCard />
        <LocationCard />
      </ScrollView>
    </SafeAreaView>
  );
}
