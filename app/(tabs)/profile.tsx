import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase/client';
import { getProfile } from '@/lib/supabase/profile';
import { calculateBmi, bmiGaugeFraction } from '@/lib/bmi';
import type { Profile } from '@/lib/supabase/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ListItem } from '@/components/ui/ListItem';

// ─── tokens (mapped from global.css forest palette) ─────────────────────────

const T = {
  bg: '#f9f4e8',
  surface: '#f4edd9',
  surfaceDeep: '#ede3c8',
  border: '#e9dbbe',
  forest: '#3c6e21',
  forestLight: '#5a9e34',
  text: '#1a2416',
  muted: '#7a8c70',
  cream: '#f9f4e8',
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── BMI gauge ───────────────────────────────────────────────────────────────

const SEGMENTS = [
  { flex: 1, color: '#93c5fd', label: '10' },   // underweight — blue-300
  { flex: 2, color: '#4ade80', label: '18.5' },  // healthy     — green-400
  { flex: 1, color: '#fbbf24', label: '25' },    // overweight  — yellow-400
  { flex: 1, color: '#fb923c', label: '30' },    // obese I     — orange-400
  { flex: 1, color: '#f87171', label: '40' },    // obese II+   — red-400
];

function BmiGauge({
  bmi,
  color,
  label,
}: {
  bmi: number;
  color: string;
  label: string;
}) {
  const pct = bmiGaugeFraction(bmi);
  const animPct = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animPct, {
      toValue: pct,
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View>
      {/* Big value + category badge */}
      <View style={styles.bmiHeader}>
        <Text style={styles.bmiValue}>{bmi}</Text>
        <View style={styles.bmiPill}>
          <View style={[styles.bmiDot, { backgroundColor: color }]} />
          <Text style={[styles.bmiLabel, { color }]}>{label}</Text>
        </View>
      </View>

      {/* Arrow indicator */}
      <View style={styles.arrowTrack}>
        <Animated.View
          style={[
            styles.arrowWrapper,
            {
              left: animPct.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '93%'],
              }),
            },
          ]}
        >
          {/* downward-pointing triangle via border trick */}
          <View style={[styles.arrow, { borderTopColor: color }]} />
        </Animated.View>
      </View>

      {/* Segmented bar */}
      <View style={styles.gaugeBar}>
        {SEGMENTS.map((seg, i) => (
          <View
            key={i}
            style={[
              styles.gaugeSegment,
              { flex: seg.flex, backgroundColor: seg.color },
              i === 0 && styles.gaugeLeft,
              i === SEGMENTS.length - 1 && styles.gaugeRight,
            ]}
          />
        ))}
      </View>

      {/* Scale labels */}
      <View style={styles.gaugeLabels}>
        {['10', '18.5', '25', '30', '40'].map((n) => (
          <Text key={n} style={styles.gaugeLabel}>
            {n}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── section header ──────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title.toUpperCase()}</Text>;
}

// ─── stat card (full-width, accent number) ───────────────────────────────────

function BigStatCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent?: string;
}) {
  return (
    <View style={[styles.card, styles.bigStatCard]}>
      <Text style={styles.bigStatLabel}>{label}</Text>
      <View style={styles.bigStatRow}>
        <Text style={[styles.bigStatValue, accent ? { color: accent } : {}]}>{value}</Text>
        {unit && <Text style={styles.bigStatUnit}>{unit}</Text>}
      </View>
    </View>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
      <SafeAreaView style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={T.forest} />
      </SafeAreaView>
    );
  }

  const displayName = profile?.name ?? email ?? 'You';
  const bmiResult =
    profile?.weight_kg && profile?.height_cm
      ? calculateBmi(profile.weight_kg, profile.height_cm)
      : null;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero header ────────────────────────────────────── */}
        <View style={styles.hero}>
          <Avatar name={displayName} size="xl" />
          <View style={styles.heroText}>
            <Text style={styles.heroName}>{displayName}</Text>
            {email && (
              <Text style={styles.heroEmail} numberOfLines={1}>
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

        <View style={styles.dividerLine} />

        {/* ── BMI ────────────────────────────────────────────── */}
        {bmiResult && (
          <>
            <SectionLabel title="Body Mass Index" />
            <View style={[styles.card, styles.bmiCard]}>
              <BmiGauge
                bmi={bmiResult.value}
                color={bmiResult.color}
                label={bmiResult.label}
              />
              <Text style={styles.bmiCaption}>
                Based on {profile!.height_cm} cm height · {profile!.weight_kg} kg weight
              </Text>
            </View>
          </>
        )}

        {/* ── Daily target ────────────────────────────────────── */}
        {!!profile?.daily_calorie_target && (
          <>
            <SectionLabel title="Daily Target" />
            <BigStatCard
              label="Calorie goal"
              value={profile.daily_calorie_target.toLocaleString()}
              unit="kcal"
              accent={T.forest}
            />
          </>
        )}

        {/* ── Body stats ──────────────────────────────────────── */}
        {(profile?.height_cm || profile?.weight_kg || profile?.age) && (
          <>
            <SectionLabel title="Body Stats" />
            <View style={styles.card}>
              {!!profile!.height_cm && (
                <ListItem
                  title="Height"
                  trailing={
                    <Text style={styles.statValue}>{profile!.height_cm} cm</Text>
                  }
                />
              )}
              {!!profile!.weight_kg && (
                <ListItem
                  title="Weight"
                  trailing={
                    <Text style={styles.statValue}>{profile!.weight_kg} kg</Text>
                  }
                />
              )}
              {!!profile!.age && (
                <ListItem
                  title="Age"
                  trailing={
                    <Text style={styles.statValue}>{profile!.age} yrs</Text>
                  }
                />
              )}
              {profile!.sex && (
                <ListItem
                  title="Sex"
                  trailing={
                    <Text style={styles.statValue}>{titleCase(profile!.sex)}</Text>
                  }
                />
              )}
            </View>
          </>
        )}

        {/* ── Goals ───────────────────────────────────────────── */}
        {!!profile?.goals?.length && (
          <>
            <SectionLabel title="Goals" />
            <View style={[styles.card, styles.chipCard]}>
              {profile.goals.map((g) => (
                <Badge key={g} variant="default">
                  {titleCase(g)}
                </Badge>
              ))}
            </View>
          </>
        )}

        {/* ── Dietary restrictions ────────────────────────────── */}
        {!!profile?.dietary_restrictions?.length && (
          <>
            <SectionLabel title="Dietary Restrictions" />
            <View style={[styles.card, styles.chipCard]}>
              {profile.dietary_restrictions.map((r) => (
                <Badge key={r} variant="warning">
                  {titleCase(r)}
                </Badge>
              ))}
            </View>
          </>
        )}

        {/* ── Empty state ─────────────────────────────────────── */}
        {!profile && (
          <View style={[styles.card, styles.emptyCard]}>
            <Text style={styles.emptyText}>
              No profile data yet.{'\n'}Complete onboarding to see your stats here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  loadingRoot: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 56 },

  // hero
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
  },
  heroText: { flex: 1 },
  heroName: {
    fontFamily: 'Syne_700Bold',
    fontSize: 24,
    color: T.text,
    letterSpacing: -0.3,
  },
  heroEmail: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: T.muted,
    marginTop: 2,
  },

  dividerLine: { height: 1, backgroundColor: T.border, marginHorizontal: 20, marginBottom: 20 },

  // section label
  sectionLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.2,
    color: T.muted,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 4,
  },

  // generic card
  card: {
    backgroundColor: T.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },

  // bmi card
  bmiCard: { padding: 20 },
  bmiHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  bmiValue: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 56,
    color: T.text,
    lineHeight: 60,
  },
  bmiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.surfaceDeep,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bmiDot: { width: 8, height: 8, borderRadius: 4 },
  bmiLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 },
  bmiCaption: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: T.muted,
    marginTop: 10,
    lineHeight: 16,
  },

  // gauge
  arrowTrack: { height: 14, position: 'relative', marginBottom: 4 },
  arrowWrapper: { position: 'absolute', alignItems: 'center' },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    // borderTopColor set inline to match category
  },
  gaugeBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
    gap: 1.5,
  },
  gaugeSegment: { height: '100%' },
  gaugeLeft: { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
  gaugeRight: { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  gaugeLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 10,
    color: T.muted,
  },

  // big stat card
  bigStatCard: { padding: 20 },
  bigStatLabel: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: T.muted,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  bigStatRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  bigStatValue: {
    fontFamily: 'Syne_700Bold',
    fontSize: 40,
    color: T.text,
    lineHeight: 44,
  },
  bigStatUnit: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: T.muted,
    marginBottom: 6,
  },

  // body stats value
  statValue: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: T.text,
  },

  // chip card
  chipCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
  },

  // empty state
  emptyCard: { padding: 32, alignItems: 'center' },
  emptyText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: T.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
