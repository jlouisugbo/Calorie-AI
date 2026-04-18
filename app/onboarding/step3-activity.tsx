import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StepProgress } from '@/components/onboarding/StepProgress';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from './_layout';
import { upsertProfile } from '@/lib/supabase/profile';
import { supabase } from '@/lib/supabase/client';
import type { ActivityLevel, SexType } from '@/lib/supabase/types';

interface ActivityOption {
  value: ActivityLevel;
  icon: string;
  label: string;
  description: string;
  fallbackCalories: number;
  activityFactor: number;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    value: 'sedentary',
    icon: '🪑',
    label: 'Sedentary',
    description: 'Desk job, little to no exercise',
    fallbackCalories: 1800,
    activityFactor: 1.2,
  },
  {
    value: 'lightly_active',
    icon: '🚶',
    label: 'Lightly Active',
    description: 'Light exercise 1–3 days per week',
    fallbackCalories: 2000,
    activityFactor: 1.375,
  },
  {
    value: 'active',
    icon: '🏃',
    label: 'Active',
    description: 'Moderate exercise 3–5 days per week',
    fallbackCalories: 2200,
    activityFactor: 1.55,
  },
  {
    value: 'very_active',
    icon: '💪',
    label: 'Very Active',
    description: 'Intense exercise 6–7 days per week',
    fallbackCalories: 2600,
    activityFactor: 1.725,
  },
];

function mifflinStJeor(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: SexType | null
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'male') return base + 5;
  if (sex === 'female') return base - 161;
  // other / prefer_not_to_say / null → average of male + female formulas
  return base + (5 + -161) / 2;
}

function roundToNearest(n: number, step: number): number {
  return Math.round(n / step) * step;
}

export default function Step3Activity() {
  const router = useRouter();
  const {
    goals,
    dietaryRestrictions,
    activityLevel,
    setActivityLevel,
    setDailyCalorieTarget,
    name,
    age,
    heightCm,
    weightKg,
    sex,
  } = useOnboarding();
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => {
    const a = parseInt(age, 10);
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    const valid =
      !Number.isNaN(a) && a > 0 && !Number.isNaN(h) && h > 0 && !Number.isNaN(w) && w > 0;
    return { a, h, w, valid };
  }, [age, heightCm, weightKg]);

  function caloriesFor(option: ActivityOption): number {
    if (!parsed.valid) return option.fallbackCalories;
    const bmr = mifflinStJeor(parsed.w, parsed.h, parsed.a, sex);
    return roundToNearest(bmr * option.activityFactor, 50);
  }

  function selectActivity(option: ActivityOption) {
    setActivityLevel(option.value);
    setDailyCalorieTarget(caloriesFor(option));
  }

  async function handleFinish() {
    if (!activityLevel) return;
    setSaving(true);

    const selected = ACTIVITY_OPTIONS.find((o) => o.value === activityLevel)!;
    const calories = caloriesFor(selected);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (userId) {
      await upsertProfile(userId, {
        goals,
        dietary_restrictions: dietaryRestrictions,
        activity_level: activityLevel,
        daily_calorie_target: calories,
        name: name || undefined,
        age: parsed.valid ? parsed.a : undefined,
        height_cm: parsed.valid ? parsed.h : undefined,
        weight_kg: parsed.valid ? parsed.w : undefined,
        sex: sex ?? undefined,
      });
    }

    setSaving(false);
    router.replace('/(tabs)/home');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8">
          <StepProgress currentStep={4} totalSteps={4} />
          <Text className="text-3xl font-display text-foreground mt-6 mb-2">
            How active are you?
          </Text>
          <Text className="text-base font-sans text-muted-foreground">
            {parsed.valid
              ? 'We calibrated these targets from your body info. You can always adjust later.'
              : 'This sets your starting calorie target. You can always adjust it later.'}
          </Text>
        </View>

        {/* Activity cards */}
        <View className="gap-3">
          {ACTIVITY_OPTIONS.map((option) => {
            const isSelected = activityLevel === option.value;
            const kcal = caloriesFor(option);
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.75}
                onPress={() => selectActivity(option)}
                className={[
                  'rounded-2xl border p-4',
                  isSelected ? 'bg-primary border-primary' : 'bg-card border-border',
                ].join(' ')}
              >
                <View className="flex-row items-center gap-3 mb-1">
                  <Text className="text-2xl">{option.icon}</Text>
                  <Text
                    className={[
                      'text-base font-semibold flex-1',
                      isSelected ? 'text-primary-foreground' : 'text-foreground',
                    ].join(' ')}
                  >
                    {option.label}
                  </Text>
                  <Text
                    className={[
                      'text-sm font-medium',
                      isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    ~{kcal} cal
                  </Text>
                </View>
                <Text
                  className={[
                    'text-sm ml-9',
                    isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View className="px-6 pb-8 pt-4 border-t border-border bg-background">
        <Button
          size="lg"
          disabled={!activityLevel}
          loading={saving}
          className="w-full rounded-2xl"
          onPress={handleFinish}
        >
          Let's go 🌿
        </Button>
      </View>
    </SafeAreaView>
  );
}
