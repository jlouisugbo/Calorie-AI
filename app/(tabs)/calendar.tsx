import { useEffect, useMemo, useState } from 'react';
import { Text, ScrollView, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCalendarStore } from '@/store/calendarStore';
import { exchangeGoogleAuthCode } from '@/services/calendar';
import { supabase } from '@/lib/supabase/client';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.readonly',
];

const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? '';
const CONFIGURED_REDIRECT = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_REDIRECT;

function formatEventTime(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function CalendarScreen() {
  const { events, isLoading, error, refresh } = useCalendarStore();
  const [connecting, setConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const redirectUri = useMemo(() => {
    if (CONFIGURED_REDIRECT) return CONFIGURED_REDIRECT;
    return 'http://localhost:8081/oauth';
  }, []);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      redirectUri,
      scopes: SCOPES,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: { access_type: 'offline', prompt: 'consent' },
    },
    GOOGLE_DISCOVERY,
  );

  useEffect(() => {
    if (response?.type !== 'success') return;
    const code = response.params.code;
    const verifier = request?.codeVerifier;
    if (!code || !verifier) return;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (!userId) {
          setStatusMessage('Sign in to connect your calendar.');
          setConnecting(false);
          return;
        }
        await exchangeGoogleAuthCode({
          userId,
          code,
          codeVerifier: verifier,
          redirectUri,
        });
        setStatusMessage('Calendar connected.');
        setConnecting(false);
        await refresh();
      } catch (err) {
        setStatusMessage(
          err instanceof Error ? err.message : 'Failed to connect calendar',
        );
        setConnecting(false);
      }
    })();
  }, [response, request, redirectUri, refresh]);

  const handleConnect = async () => {
    if (!CLIENT_ID) {
      setStatusMessage('Set EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID in your .env');
      return;
    }
    setStatusMessage(null);
    setConnecting(true);
    await promptAsync();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingVertical: 24 }}>
        <Text className="text-3xl font-display text-text-base mb-2">Calendar</Text>
        <Text className="text-base font-sans text-muted mb-6">
          Connect Google Calendar so the agent can plan around your day.
        </Text>

        <Card className="mb-4">
          <Text className="text-lg font-semibold text-text-base mb-1">
            Google Calendar
          </Text>
          <Text className="text-sm text-muted mb-4">
            Read-only access. We use it to time food and recovery suggestions
            around your meetings, travel, and workouts.
          </Text>
          <View className="flex-row gap-2">
            <Button onPress={handleConnect} loading={connecting} disabled={!request}>
              Connect Google Calendar
            </Button>
            <Button variant="outline" onPress={() => void refresh()} loading={isLoading}>
              Refresh
            </Button>
          </View>
          {statusMessage ? (
            <Text className="text-xs text-muted mt-3">{statusMessage}</Text>
          ) : null}
          {error ? (
            <Text className="text-xs text-destructive mt-2">{error}</Text>
          ) : null}
        </Card>

        <Text className="text-sm font-semibold text-text-base mb-2 mt-2">
          Next 24 hours
        </Text>

        {isLoading && events.length === 0 ? (
          <View className="py-6 items-center">
            <ActivityIndicator />
          </View>
        ) : events.length === 0 ? (
          <Card>
            <Text className="text-sm text-muted">
              No upcoming events yet. Connect your calendar above to see them
              here.
            </Text>
          </Card>
        ) : (
          events.map((ev) => (
            <Card key={ev.id} className="mb-3">
              <Text className="text-base font-semibold text-text-base">
                {ev.summary ?? '(no title)'}
              </Text>
              <Text className="text-xs text-muted mt-1">
                {formatEventTime(ev.start)}
                {ev.location ? ` · ${ev.location}` : ''}
              </Text>
              {ev.description ? (
                <Text className="text-xs text-muted mt-2" numberOfLines={3}>
                  {ev.description}
                </Text>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
