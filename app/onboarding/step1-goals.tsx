import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GoalChip } from '@/components/onboarding/GoalChip';
import { StepProgress } from '@/components/onboarding/StepProgress';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from './_layout';
import type { NutritionGoal } from '@/lib/supabase/types';

const GOALS: { value: NutritionGoal; icon: string; label: string }[] = [
  { value: 'weight_loss', icon: '🔥', label: 'Lose Weight' },
  { value: 'muscle_gain', icon: '💪', label: 'Build Muscle' },
  { value: 'maintain_weight', icon: '⚖️', label: 'Maintain Weight' },
  { value: 'eat_healthier', icon: '🥗', label: 'Eat Healthier' },
  { value: 'boost_energy', icon: '⚡', label: 'Boost Energy' },
  { value: 'improve_performance', icon: '🏃', label: 'Improve Performance' },
];

export default function Step1Goals() {
  const router = useRouter();
  const { goals, setGoals } = useOnboarding();

  function toggleGoal(value: NutritionGoal) {
    setGoals(goals.includes(value) ? goals.filter((g) => g !== value) : [...goals, value]);
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
          <StepProgress currentStep={1} totalSteps={4} />
          <Text className="text-3xl font-display text-foreground mt-6 mb-2">
            What are your goals?
          </Text>
          <Text className="text-base font-sans text-muted-foreground">
            Pick everything that applies — your coach will personalize advice around all of them.
          </Text>
        </View>

        {/* Goal chips */}
        <View className="gap-3">
          {GOALS.map((goal) => (
            <GoalChip
              key={goal.value}
              icon={goal.icon}
              label={goal.label}
              selected={goals.includes(goal.value)}
              onPress={() => toggleGoal(goal.value)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View className="px-6 pb-8 pt-4 border-t border-border bg-background">
        <Button
          size="lg"
          disabled={goals.length === 0}
          className="w-full rounded-2xl"
          onPress={() => router.push('/onboarding/step2-body')}
        >
          Continue
        </Button>
        {goals.length === 0 && (
          <Text className="text-xs text-center text-muted-foreground mt-2">
            Select at least one goal to continue
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
