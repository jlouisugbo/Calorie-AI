export type BmiCategory =
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obese_1'
  | 'obese_2'
  | 'obese_3';

export interface BmiResult {
  value: number;
  category: BmiCategory;
  label: string;
  color: string;
}

const CATEGORY_MAP: Array<{
  max: number;
  category: BmiCategory;
  label: string;
  color: string;
}> = [
  { max: 18.5, category: 'underweight', label: 'Underweight', color: '#3b82f6' },
  { max: 25.0, category: 'normal', label: 'Healthy', color: '#22c55e' },
  { max: 30.0, category: 'overweight', label: 'Overweight', color: '#f59e0b' },
  { max: 35.0, category: 'obese_1', label: 'Obese I', color: '#f97316' },
  { max: 40.0, category: 'obese_2', label: 'Obese II', color: '#ef4444' },
  { max: Infinity, category: 'obese_3', label: 'Obese III', color: '#7f1d1d' },
];

/**
 * Computes BMI and returns value + WHO category classification.
 * @param weightKg  body weight in kilograms
 * @param heightCm  height in centimetres
 */
export function calculateBmi(weightKg: number, heightCm: number): BmiResult {
  const heightM = heightCm / 100;
  const value = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  const entry = CATEGORY_MAP.find((c) => value < c.max) ?? CATEGORY_MAP[CATEGORY_MAP.length - 1];
  return { value, category: entry.category, label: entry.label, color: entry.color };
}

/** Returns the fraction (0–1) of the BMI gauge that should be filled, capped at the 40 mark. */
export function bmiGaugeFraction(bmi: number): number {
  const MIN = 10;
  const MAX = 40;
  return Math.min(1, Math.max(0, (bmi - MIN) / (MAX - MIN)));
}
