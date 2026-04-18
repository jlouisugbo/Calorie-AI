import { Text, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'expo-router';
import { useLocationStore } from '@/store/locationStore';

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

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingVertical: 24 }}>
        <Text className="text-4xl font-display text-text-base mb-2">Baseplate</Text>
        <Text className="text-base font-sans text-muted mb-8">AI-powered mobile app</Text>

        <LocationCard />

        <Card className="mb-4">
          <Text className="text-lg font-semibold text-text-base mb-1">AI Chat</Text>
          <Text className="text-sm text-muted mb-4">
            Have a conversation with Claude claude-sonnet-4-6.
          </Text>
          <Button onPress={() => router.push('/(tabs)/chat')}>Start chatting</Button>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
