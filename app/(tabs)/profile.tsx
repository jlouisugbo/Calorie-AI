import { useEffect, useState } from 'react';
import { ScrollView, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase/client';
import { getProfile } from '@/lib/supabase/profile';
import { calculateBmi, bmiGaugeFraction } from '@/lib/bmi';
import type { Profile } from '@/lib/supabase/types';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ListItem } from '@/components/ui/ListItem';

// ─── helpers ────────────────────────────────────────────────────────────────

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── sub-components ─────────────────────────────────────────────────────────

function BmiGauge({ bmi, color, label }: { bmi: number; color: string; label: string }) {
  const pct = bmiGaugeFraction(bmi);

  return (
    <View>
      {/* Value + badge row */}
      <View className="flex-row items-end gap-3 mb-4">
        <Text className="text-5xl font-bold text-text-base">{bmi}</Text>
        <View className="mb-1 rounded-full px-3 py-1" style={{ backgroundColor: `${color}22` }}>
          <Text className="text-sm font-semibold" style={{ color }}>
            {label}
          </Text>
        </View>
      </View>

      {/* Segmented colour bar */}
      <View className="flex-row h-3 rounded-full overflow-hidden gap-px mb-3">
        <View className="flex-1 bg-blue-400 rounded-l-full" />
        <View className="flex-[2] bg-green-400" />
        <View className="flex-1 bg-yellow-400" />
        <View className="flex-1 bg-orange-400" />
        <View className="flex-1 bg-red-500 rounded-r-full" />
      </View>

      {/* Marker */}
      <View className="relative h-3 mb-2">
        <View
          className="absolute -top-1 w-3 h-5 rounded-sm bg-text-base opacity-80"
          style={{ left: `${Math.round(pct * 100)}%`, marginLeft: -6 }}
        />
      </View>

      {/* Scale labels */}
      <View className="flex-row justify-between">
        {['10', '18.5', '25', '30', '40'].map((n) => (
          <Text key={n} className="text-xs text-muted">
            {n}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── main screen ────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // getUser() re-validates the token server-side — safer than getSession()
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setLoading(false);
        return;
      }
      setEmail(user.email ?? null);
      const p = await getProfile(user.id);
      setProfile(p);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#3c6e21" />
      </SafeAreaView>
    );
  }

  const displayName = profile?.name ?? email ?? 'You';
  const bmiResult =
    profile?.weight_kg && profile?.height_cm
      ? calculateBmi(profile.weight_kg, profile.height_cm)
      : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View className="px-5 pt-6 pb-2">
          <Text className="text-3xl font-display text-text-base">Profile</Text>
        </View>

        {/* ── Identity card ── */}
        <View className="px-5 mt-4 mb-3">
          <Card>
            <View className="flex-row items-center gap-4">
              <Avatar name={displayName} size="xl" />
              <View className="flex-1">
                <Text className="text-xl font-semibold text-text-base">{displayName}</Text>
                {email && (
                  <Text className="text-sm text-muted mt-0.5" numberOfLines={1}>
                    {email}
                  </Text>
                )}
                {profile?.activity_level && (
                  <Badge variant="secondary" className="mt-2 self-start">
                    {titleCase(profile.activity_level)}
                  </Badge>
                )}
              </View>
            </View>
          </Card>
        </View>

        {/* ── BMI card ── */}
        {bmiResult && (
          <View className="px-5 mb-3">
            <Card>
              <CardHeader>
                <CardTitle>Body Mass Index</CardTitle>
              </CardHeader>
              <CardContent>
                <BmiGauge bmi={bmiResult.value} color={bmiResult.color} label={bmiResult.label} />
                <Text className="text-xs text-muted mt-4 leading-4">
                  Calculated from your height ({profile!.height_cm} cm) and weight (
                  {profile!.weight_kg} kg).
                </Text>
              </CardContent>
            </Card>
          </View>
        )}

        {/* ── Body stats ── */}
        {(profile?.height_cm || profile?.weight_kg || profile?.age) && (
          <View className="px-5 mb-3">
            <Card>
              <CardHeader>
                <CardTitle>Body Stats</CardTitle>
              </CardHeader>
              <CardContent>
                {!!profile!.height_cm && (
                  <ListItem title="Height" trailing={<Text className="text-sm font-semibold text-text-base">{profile!.height_cm} cm</Text>} />
                )}
                {!!profile!.weight_kg && (
                  <ListItem title="Weight" trailing={<Text className="text-sm font-semibold text-text-base">{profile!.weight_kg} kg</Text>} />
                )}
                {!!profile!.age && (
                  <ListItem title="Age" trailing={<Text className="text-sm font-semibold text-text-base">{profile!.age} yrs</Text>} />
                )}
                {profile!.sex && (
                  <ListItem title="Sex" trailing={<Text className="text-sm font-semibold text-text-base">{titleCase(profile!.sex)}</Text>} />
                )}
              </CardContent>
            </Card>
          </View>
        )}

        {/* ── Calorie target ── */}
        {!!profile?.daily_calorie_target && (
          <View className="px-5 mb-3">
            <Card>
              <CardHeader>
                <CardTitle>Daily Calorie Target</CardTitle>
              </CardHeader>
              <CardContent>
                <View className="flex-row items-end gap-1">
                  <Text className="text-4xl font-bold text-text-base">
                    {profile.daily_calorie_target.toLocaleString()}
                  </Text>
                  <Text className="text-base text-muted mb-1">kcal</Text>
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* ── Goals ── */}
        {!!profile?.goals?.length && (
          <View className="px-5 mb-3">
            <Card>
              <CardHeader>
                <CardTitle>Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <View className="flex-row flex-wrap gap-2">
                  {profile.goals.map((g) => (
                    <Badge key={g} variant="default">
                      {titleCase(g)}
                    </Badge>
                  ))}
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* ── Dietary restrictions ── */}
        {!!profile?.dietary_restrictions?.length && (
          <View className="px-5 mb-3">
            <Card>
              <CardHeader>
                <CardTitle>Dietary Restrictions</CardTitle>
              </CardHeader>
              <CardContent>
                <View className="flex-row flex-wrap gap-2">
                  {profile.dietary_restrictions.map((r) => (
                    <Badge key={r} variant="warning">
                      {titleCase(r)}
                    </Badge>
                  ))}
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* ── Empty state ── */}
        {!profile && (
          <View className="px-5">
            <Card>
              <Text className="text-sm text-muted text-center py-6">
                No profile data yet.{'\n'}Complete onboarding to see your stats here.
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
