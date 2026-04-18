export type ActivityLevel = 'sedentary' | 'lightly_active' | 'active' | 'very_active';

export type NutritionGoal =
  | 'weight_loss'
  | 'muscle_gain'
  | 'maintain_weight'
  | 'eat_healthier'
  | 'boost_energy'
  | 'improve_performance';

export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'dairy_free'
  | 'nut_free'
  | 'paleo'
  | 'keto'
  | 'halal'
  | 'kosher';

export type Sex = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type SexType = Sex;

export interface Profile {
  id: string;
  user_id: string;
  goals: NutritionGoal[];
  dietary_restrictions: DietaryRestriction[];
  activity_level: ActivityLevel;
  daily_calorie_target: number;
  created_at: string;
  name?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  sex?: Sex;
}

export interface OnboardingData {
  goals: NutritionGoal[];
  dietary_restrictions: DietaryRestriction[];
  activity_level: ActivityLevel | null;
  daily_calorie_target: number;
  name?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  sex?: Sex;
}
