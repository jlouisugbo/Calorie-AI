import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GoalChip } from '@/components/onboarding/GoalChip';
import { StepProgress } from '@/components/onboarding/StepProgress';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from './_layout';
import type { DietaryRestriction } from '@/lib/supabase/types';

const RESTRICTIONS: { value: DietaryRestriction; icon: string; label: string }[] = [
  { value: 'vegetarian', icon: '🌱', label: 'Vegetarian' },
  { value: 'vegan', icon: '🌿', label: 'Vegan' },
  { value: 'gluten_free', icon: '🌾', label: 'Gluten Free' },
  { value: 'dairy_free', icon: '🥛', label: 'Dairy Free' },
  { value: 'nut_free', icon: '🥜', label: 'Nut Free' },
  { value: 'keto', icon: '🥑', label: 'Keto / Low Carb' },
  { value: 'paleo', icon: '🍖', label: 'Paleo' },
  { value: 'halal', icon: '☪️', label: 'Halal' },
  { value: 'kosher', icon: '✡️', label: 'Kosher' },
];

export default function Step2Restrictions() {
  const router = useRouter();
  const { dietaryRestrictions, setDietaryRestrictions } = useOnboarding();

  function toggleRestriction(value: DietaryRestriction) {
    setDietaryRestrictions(
      dietaryRestrictions.includes(value)
        ? dietaryRestrictions.filter((r) => r !== value)
        : [...dietaryRestrictions, value]
    );
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
          <StepProgress currentStep={3} totalSteps={4} />
          <Text className="text-3xl font-display text-foreground mt-6 mb-2">
            Any dietary restrictions?
          </Text>
          <Text className="text-base font-sans text-muted-foreground">
            Skip this if none apply — your coach won't recommend foods that don't work for you.
          </Text>
        </View>

        {/* Restriction chips */}
        <View className="gap-3">
          {RESTRICTIONS.map((r) => (
            <GoalChip
              key={r.value}
              icon={r.icon}
              label={r.label}
              selected={dietaryRestrictions.includes(r.value)}
              onPress={() => toggleRestriction(r.value)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Footer — skip allowed on this step */}
      <View className="px-6 pb-8 pt-4 border-t border-border bg-background gap-3">
        <Button
          size="lg"
          className="w-full rounded-2xl"
          onPress={() => router.push('/onboarding/step3-activity')}
        >
          Continue
        </Button>
        {dietaryRestrictions.length === 0 && (
          <Button
            size="lg"
            variant="ghost"
            className="w-full rounded-2xl"
            onPress={() => router.push('/onboarding/step3-activity')}
          >
            Skip — no restrictions
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}
