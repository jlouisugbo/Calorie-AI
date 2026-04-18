import { createContext, useContext, useState } from 'react';
import { Stack } from 'expo-router';
import type {
  NutritionGoal,
  DietaryRestriction,
  ActivityLevel,
  SexType,
} from '@/lib/supabase/types';

interface OnboardingState {
  goals: NutritionGoal[];
  setGoals: (goals: NutritionGoal[]) => void;
  dietaryRestrictions: DietaryRestriction[];
  setDietaryRestrictions: (r: DietaryRestriction[]) => void;
  activityLevel: ActivityLevel | null;
  setActivityLevel: (level: ActivityLevel) => void;
  dailyCalorieTarget: number;
  setDailyCalorieTarget: (target: number) => void;
  name: string;
  setName: (name: string) => void;
  age: string;
  setAge: (age: string) => void;
  heightCm: string;
  setHeightCm: (height: string) => void;
  weightKg: string;
  setWeightKg: (weight: string) => void;
  sex: SexType | null;
  setSex: (sex: SexType | null) => void;
}

export const OnboardingContext = createContext<OnboardingState | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within onboarding/_layout');
  return ctx;
}

export default function OnboardingLayout() {
  const [goals, setGoals] = useState<NutritionGoal[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryRestriction[]>([]);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState(2000);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [sex, setSex] = useState<SexType | null>(null);

  return (
    <OnboardingContext.Provider
      value={{
        goals,
        setGoals,
        dietaryRestrictions,
        setDietaryRestrictions,
        activityLevel,
        setActivityLevel,
        dailyCalorieTarget,
        setDailyCalorieTarget,
        name,
        setName,
        age,
        setAge,
        heightCm,
        setHeightCm,
        weightKg,
        setWeightKg,
        sex,
        setSex,
      }}
    >
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </OnboardingContext.Provider>
  );
}
