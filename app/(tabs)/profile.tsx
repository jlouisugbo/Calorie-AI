import { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ListItem } from '@/components/ui/ListItem';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { StatCard } from '@/components/ui/StatCard';

import { supabase } from '@/lib/supabase/client';
import { getProfile } from '@/lib/supabase/profile';
import {
  getLatestBiomarkersClient,
  type BiomarkerRow,
} from '@/lib/supabase/biomarkers-client';
import { seedSampleBiomarkers } from '@/services/biomarkers';
import type {
  ActivityLevel,
  DietaryRestriction,
  NutritionGoal,
  Profile,
  Sex,
} from '@/lib/supabase/types';
import { useCalendarStore } from '@/store/calendarStore';

type NotifStatus = 'granted' | 'denied' | 'undetermined' | 'unknown';

const GOAL_LABELS: Record<NutritionGoal, string> = {
  weight_loss: 'Lose Weight',
  muscle_gain: 'Build Muscle',
  maintain_weight: 'Maintain Weight',
  eat_healthier: 'Eat Healthier',
  boost_energy: 'Boost Energy',
  improve_performance: 'Improve Performance',
};

const RESTRICTION_LABELS: Record<DietaryRestriction, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  gluten_free: 'Gluten Free',
  dairy_free: 'Dairy Free',
  nut_free: 'Nut Free',
  paleo: 'Paleo',
  keto: 'Keto',
  halal: 'Halal',
  kosher: 'Kosher',
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly Active',
  active: 'Active',
  very_active: 'Very Active',
};

const SEX_LABELS: Record<Sex, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

function formatRecordedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function findLatest<K extends keyof BiomarkerRow>(
  rows: BiomarkerRow[],
  key: K,
): BiomarkerRow[K] | null {
  for (const row of rows) {
    const value = row[key];
    if (value !== null && value !== undefined) return value;
  }
  return null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const calendarConnected = useCalendarStore((s) => s.isConnected);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [biomarkers, setBiomarkers] = useState<BiomarkerRow[]>([]);
  const [notifStatus, setNotifStatus] = useState<NotifStatus>('unknown');

  const refreshNotifStatus = useCallback(async () => {
    try {
      const res = await Notifications.getPermissionsAsync();
      const status = res.status as NotifStatus;
      setNotifStatus(status);
    } catch {
      setNotifStatus('unknown');
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }
      setEmail(user.email ?? null);
      setUserId(user.id);
      const providerRaw =
        (user.app_metadata as { provider?: string } | undefined)?.provider ?? null;
      setProvider(providerRaw);

      const [p, bm] = await Promise.all([
        getProfile(user.id),
        getLatestBiomarkersClient(user.id, 7),
        refreshNotifStatus(),
      ]);
      setProfile(p);
      setBiomarkers(bm);
    } finally {
      setLoading(false);
    }
  }, [router, refreshNotifStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void refreshNotifStatus();
    }, [refreshNotifStatus]),
  );

  async function handleNotificationsPress() {
    if (notifStatus === 'undetermined' || notifStatus === 'unknown') {
      try {
        await Notifications.requestPermissionsAsync();
      } catch {
        // ignore
      }
      await refreshNotifStatus();
      return;
    }
    try {
      await Linking.openSettings();
    } catch {
      // ignore
    }
  }

  async function handleSeedBiomarkers() {
    if (!userId) {
      setSeedError('Sign in to seed sample biomarkers.');
      return;
    }
    setSeeding(true);
    setSeedError(null);
    try {
      await seedSampleBiomarkers(userId, 7);
      const fresh = await getLatestBiomarkersClient(userId, 7);
      setBiomarkers(fresh);
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : 'Seeding failed');
    } finally {
      setSeeding(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/login');
    } finally {
      setSigningOut(false);
    }
  }

  const displayName = profile?.name?.trim() || email?.split('@')[0] || 'You';

  const latestGlucose = findLatest(biomarkers, 'glucose_mg_dl');
  const latestRestingHr = findLatest(biomarkers, 'resting_hr');
  const latestHrv = findLatest(biomarkers, 'hrv_ms');
  const latestSleep = findLatest(biomarkers, 'sleep_hours');
  const latestSteps = findLatest(biomarkers, 'steps');

  const notifLabel =
    notifStatus === 'granted'
      ? 'On'
      : notifStatus === 'denied'
        ? 'Off'
        : notifStatus === 'undetermined'
          ? 'Not set'
          : '—';
  const notifVariant: 'success' | 'destructive' | 'secondary' =
    notifStatus === 'granted'
      ? 'success'
      : notifStatus === 'denied'
        ? 'destructive'
        : 'secondary';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 24, paddingBottom: 48 }}
      >
        <Text className="text-4xl font-display text-foreground mb-1">Profile</Text>
        <Text className="text-base font-sans text-muted-foreground mb-6">
          Your plan, body stats, and recent biomarkers
        </Text>

        {/* Account header */}
        <Card className="mb-4">
          <View className="flex-row items-center">
            <Avatar name={displayName} size="xl" />
            <View className="ml-4 flex-1">
              {loading && !profile ? (
                <SkeletonText lines={2} />
              ) : (
                <>
                  <Text className="text-xl font-semibold text-foreground">{displayName}</Text>
                  {email && (
                    <View className="flex-row items-center gap-2 mt-0.5">
                      <Text
                        className="text-sm text-muted-foreground flex-shrink"
                        numberOfLines={1}
                      >
                        {email}
                      </Text>
                      {provider === 'google' && (
                        <Badge variant="secondary">Google</Badge>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </Card>

        {/* Plan */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Your plan</Text>

          {loading && !profile ? (
            <SkeletonText lines={3} />
          ) : profile ? (
            <View className="gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">Daily target</Text>
                <Text className="text-base font-semibold text-foreground">
                  {profile.daily_calorie_target} kcal
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">Activity</Text>
                <Badge variant="success">
                  {ACTIVITY_LABELS[profile.activity_level] ?? profile.activity_level}
                </Badge>
              </View>

              <View>
                <Text className="text-sm text-muted-foreground mb-2">Goals</Text>
                {profile.goals?.length ? (
                  <View className="flex-row flex-wrap gap-2">
                    {profile.goals.map((g) => (
                      <Chip key={g} variant="primary">
                        {GOAL_LABELS[g] ?? g}
                      </Chip>
                    ))}
                  </View>
                ) : (
                  <Text className="text-sm text-muted-foreground">None selected</Text>
                )}
              </View>

              <View>
                <Text className="text-sm text-muted-foreground mb-2">Dietary restrictions</Text>
                {profile.dietary_restrictions?.length ? (
                  <View className="flex-row flex-wrap gap-2">
                    {profile.dietary_restrictions.map((r) => (
                      <Chip key={r}>{RESTRICTION_LABELS[r] ?? r}</Chip>
                    ))}
                  </View>
                ) : (
                  <Text className="text-sm text-muted-foreground">None</Text>
                )}
              </View>
            </View>
          ) : (
            <View>
              <Text className="text-sm text-muted-foreground mb-3">
                You haven&apos;t finished onboarding yet.
              </Text>
              <Button onPress={() => router.push('/onboarding/step1-goals')}>
                Finish onboarding
              </Button>
            </View>
          )}
        </Card>

        {/* Body */}
        {profile && (
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Body</Text>
            <View>
              <ListItem
                title="Age"
                trailing={
                  <Text className="text-sm text-foreground">
                    {profile.age != null ? `${profile.age}` : '—'}
                  </Text>
                }
              />
              <ListItem
                title="Sex"
                trailing={
                  <Text className="text-sm text-foreground">
                    {profile.sex ? SEX_LABELS[profile.sex] : '—'}
                  </Text>
                }
              />
              <ListItem
                title="Height"
                trailing={
                  <Text className="text-sm text-foreground">
                    {profile.height_cm != null ? `${profile.height_cm} cm` : '—'}
                  </Text>
                }
              />
              <ListItem
                title="Weight"
                trailing={
                  <Text className="text-sm text-foreground">
                    {profile.weight_kg != null ? `${profile.weight_kg} kg` : '—'}
                  </Text>
                }
                className="border-b-0"
              />
            </View>
          </Card>
        )}

        {/* Biomarkers */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-foreground">Biomarkers</Text>
          <View className="flex-row items-center gap-2">
            {biomarkers.length > 0 && (
              <Text className="text-xs text-muted-foreground">
                Updated {formatRecordedAt(biomarkers[0].recorded_at)}
              </Text>
            )}
            <Button
              variant="outline"
              size="sm"
              onPress={() => void handleSeedBiomarkers()}
              loading={seeding}
            >
              {biomarkers.length === 0 ? 'Seed sample' : 'Reseed'}
            </Button>
          </View>
        </View>
        {seedError ? (
          <Text className="text-xs text-destructive mb-2">{seedError}</Text>
        ) : null}

        {loading && biomarkers.length === 0 ? (
          <View className="flex-row flex-wrap gap-3 mb-4">
            <Skeleton className="h-24 flex-1 min-w-[45%]" />
            <Skeleton className="h-24 flex-1 min-w-[45%]" />
            <Skeleton className="h-24 flex-1 min-w-[45%]" />
            <Skeleton className="h-24 flex-1 min-w-[45%]" />
          </View>
        ) : biomarkers.length === 0 ? (
          <Card className="mb-4">
            <Text className="text-sm text-muted-foreground">
              No biomarkers yet. Tap &quot;Seed sample&quot; above to populate a
              busy-pro week so the AI coach has context to reason about.
            </Text>
          </Card>
        ) : (
          <>
            <View className="flex-row flex-wrap gap-3 mb-3">
              <View className="flex-1 min-w-[45%]">
                <StatCard
                  label="Glucose"
                  value={latestGlucose != null ? Number(latestGlucose) : '—'}
                  suffix={latestGlucose != null ? ' mg/dL' : undefined}
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <StatCard
                  label="Resting HR"
                  value={latestRestingHr != null ? Number(latestRestingHr) : '—'}
                  suffix={latestRestingHr != null ? ' bpm' : undefined}
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <StatCard
                  label="HRV"
                  value={latestHrv != null ? Number(latestHrv) : '—'}
                  suffix={latestHrv != null ? ' ms' : undefined}
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <StatCard
                  label="Sleep"
                  value={latestSleep != null ? Number(latestSleep) : '—'}
                  suffix={latestSleep != null ? ' h' : undefined}
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <StatCard
                  label="Steps"
                  value={latestSteps != null ? Number(latestSteps) : '—'}
                />
              </View>
            </View>

            <Card className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Recent entries</Text>
              <View>
                {biomarkers.map((row, idx) => {
                  const parts: string[] = [];
                  if (row.glucose_mg_dl != null)
                    parts.push(`${row.glucose_mg_dl} mg/dL`);
                  if (row.resting_hr != null) parts.push(`${row.resting_hr} bpm`);
                  if (row.hrv_ms != null) parts.push(`${row.hrv_ms} ms`);
                  if (row.sleep_hours != null) parts.push(`${row.sleep_hours} h sleep`);
                  if (row.steps != null) parts.push(`${row.steps} steps`);
                  const subtitle = parts.length ? parts.join(' · ') : 'No values';
                  return (
                    <ListItem
                      key={row.id}
                      title={formatRecordedAt(row.recorded_at)}
                      subtitle={subtitle}
                      trailing={
                        row.source ? (
                          <Badge variant="secondary">{row.source}</Badge>
                        ) : undefined
                      }
                      className={idx === biomarkers.length - 1 ? 'border-b-0' : ''}
                    />
                  );
                })}
              </View>
            </Card>
          </>
        )}

        {/* Settings */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-2">Settings</Text>
          <View>
            <ListItem
              title="Notifications"
              subtitle={
                notifStatus === 'undetermined' || notifStatus === 'unknown'
                  ? 'Tap to enable push notifications'
                  : notifStatus === 'denied'
                    ? 'Disabled — open OS settings to allow'
                    : 'Push notifications are on'
              }
              trailing={<Badge variant={notifVariant}>{notifLabel}</Badge>}
              onPress={handleNotificationsPress}
            />
            <ListItem
              title="Calendar"
              subtitle={
                calendarConnected
                  ? 'Google Calendar connected'
                  : 'Connect Google Calendar to plan around your day'
              }
              trailing={
                <Badge variant={calendarConnected ? 'success' : 'secondary'}>
                  {calendarConnected ? 'Connected' : 'Not connected'}
                </Badge>
              }
              onPress={() => router.push('/(tabs)/calendar')}
            />
            <ListItem
              title="Edit profile"
              subtitle="Update goals, body, and activity"
              trailing={<Text className="text-muted-foreground text-base">›</Text>}
              onPress={() => router.push('/onboarding/step1-goals')}
              className="border-b-0"
            />
          </View>
        </Card>

        {/* Sign out */}
        <View className="mt-2 mb-2">
          <Button
            variant="destructive"
            size="lg"
            onPress={handleSignOut}
            loading={signingOut}
            disabled={signingOut}
            className="w-full rounded-2xl"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Button>
          <Text className="text-xs text-muted-foreground text-center mt-2">
            You can sign back in anytime with email or Google.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
