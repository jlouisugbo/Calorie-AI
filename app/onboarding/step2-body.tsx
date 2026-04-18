import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StepProgress } from '@/components/onboarding/StepProgress';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from './_layout';
import type { SexType } from '@/lib/supabase/types';

type WeightUnit = 'lbs' | 'kg';

const SEX_OPTIONS: { value: SexType; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const LBS_PER_KG = 2.20462;
const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;
const MIN_AGE = 1;
const MAX_AGE = 120;

function cmFromFeetInches(feet: string, inches: string): string {
  const f = parseFloat(feet);
  const i = parseFloat(inches);
  if (Number.isNaN(f) && Number.isNaN(i)) return '';
  const totalInches = (Number.isNaN(f) ? 0 : f) * INCHES_PER_FOOT + (Number.isNaN(i) ? 0 : i);
  if (totalInches <= 0) return '';
  return (totalInches * CM_PER_INCH).toFixed(1);
}

function kgFromWeight(value: string, unit: WeightUnit): string {
  const n = parseFloat(value);
  if (Number.isNaN(n) || n <= 0) return '';
  if (unit === 'kg') return n.toFixed(1);
  return (n / LBS_PER_KG).toFixed(1);
}

interface FieldLabelProps {
  children: React.ReactNode;
}

function FieldLabel({ children }: FieldLabelProps) {
  return (
    <Text className="text-sm font-semibold text-foreground mb-2 tracking-tight">{children}</Text>
  );
}

interface StyledInputProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  suffix?: string;
  className?: string;
}

function StyledInput({
  value,
  onChangeText,
  placeholder,
  suffix,
  className = '',
}: StyledInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      className={[
        'flex-row items-center rounded-2xl border bg-card px-4 py-3',
        focused ? 'border-primary' : 'border-border',
        className,
      ].join(' ')}
    >
      <TextInput
        className="flex-1 text-base font-sans text-foreground"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType="numeric"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {suffix && <Text className="text-sm font-medium text-muted-foreground ml-2">{suffix}</Text>}
    </View>
  );
}

export default function Step2Body() {
  const router = useRouter();
  const { age, setAge, heightCm, setHeightCm, weightKg, setWeightKg, sex, setSex } =
    useOnboarding();

  // Local UI state — we keep both feet/inches and a weight-in-current-unit string so
  // users can type naturally. The context always stores the canonical cm / kg values.
  const [feet, setFeet] = useState(() => {
    const cm = parseFloat(heightCm);
    if (Number.isNaN(cm) || cm <= 0) return '';
    const totalInches = cm / CM_PER_INCH;
    return String(Math.floor(totalInches / INCHES_PER_FOOT));
  });
  const [inches, setInches] = useState(() => {
    const cm = parseFloat(heightCm);
    if (Number.isNaN(cm) || cm <= 0) return '';
    const totalInches = cm / CM_PER_INCH;
    return String(Math.round(totalInches % INCHES_PER_FOOT));
  });

  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs');
  const [weightInput, setWeightInput] = useState(() => {
    const kg = parseFloat(weightKg);
    if (Number.isNaN(kg) || kg <= 0) return '';
    return (kg * LBS_PER_KG).toFixed(0);
  });

  const [errors, setErrors] = useState<{ age?: string; height?: string; weight?: string }>({});

  function handleFeet(v: string) {
    const cleaned = v.replace(/[^0-9]/g, '');
    setFeet(cleaned);
    setHeightCm(cmFromFeetInches(cleaned, inches));
  }

  function handleInches(v: string) {
    const cleaned = v.replace(/[^0-9]/g, '');
    setInches(cleaned);
    setHeightCm(cmFromFeetInches(feet, cleaned));
  }

  function handleWeightChange(v: string) {
    const cleaned = v.replace(/[^0-9.]/g, '');
    setWeightInput(cleaned);
    setWeightKg(kgFromWeight(cleaned, weightUnit));
  }

  function switchUnit(next: WeightUnit) {
    if (next === weightUnit) return;
    const currentKg = parseFloat(weightKg);
    if (!Number.isNaN(currentKg) && currentKg > 0) {
      const displayed = next === 'kg' ? currentKg.toFixed(1) : (currentKg * LBS_PER_KG).toFixed(0);
      setWeightInput(displayed);
    }
    setWeightUnit(next);
  }

  const canContinue = useMemo(() => {
    const a = parseInt(age, 10);
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    return (
      !Number.isNaN(a) &&
      a >= MIN_AGE &&
      a <= MAX_AGE &&
      !Number.isNaN(h) &&
      h > 0 &&
      !Number.isNaN(w) &&
      w > 0
    );
  }, [age, heightCm, weightKg]);

  function handleContinue() {
    const nextErrors: typeof errors = {};
    const a = parseInt(age, 10);
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);

    if (Number.isNaN(a) || a < MIN_AGE || a > MAX_AGE) {
      nextErrors.age = `Enter an age between ${MIN_AGE} and ${MAX_AGE}`;
    }
    if (Number.isNaN(h) || h <= 0) {
      nextErrors.height = 'Enter your height';
    }
    if (Number.isNaN(w) || w <= 0) {
      nextErrors.weight = 'Enter your weight';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    router.push('/onboarding/step2-restrictions');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-8">
          <StepProgress currentStep={2} totalSteps={4} />
          <Text className="text-3xl font-display text-foreground mt-6 mb-2">Tell us about you</Text>
          <Text className="text-base font-sans text-muted-foreground">
            We use this to calibrate your daily calories and macros. Nothing is shared.
          </Text>
        </View>

        {/* Age */}
        <View className="mb-6">
          <FieldLabel>Age</FieldLabel>
          <StyledInput
            value={age}
            onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ''))}
            placeholder="25"
            suffix="years"
          />
          {errors.age && <Text className="text-xs text-destructive mt-1">{errors.age}</Text>}
        </View>

        {/* Height (ft + in) */}
        <View className="mb-6">
          <FieldLabel>Height</FieldLabel>
          <View className="flex-row gap-3">
            <StyledInput
              value={feet}
              onChangeText={handleFeet}
              placeholder="5"
              suffix="ft"
              className="flex-1"
            />
            <StyledInput
              value={inches}
              onChangeText={handleInches}
              placeholder="9"
              suffix="in"
              className="flex-1"
            />
          </View>
          {heightCm !== '' && (
            <Text className="text-xs text-muted-foreground mt-1">≈ {heightCm} cm</Text>
          )}
          {errors.height && <Text className="text-xs text-destructive mt-1">{errors.height}</Text>}
        </View>

        {/* Weight + unit toggle */}
        <View className="mb-6">
          <FieldLabel>Weight</FieldLabel>
          <View className="flex-row gap-3 items-stretch">
            <View className="flex-1">
              <StyledInput
                value={weightInput}
                onChangeText={handleWeightChange}
                placeholder={weightUnit === 'lbs' ? '160' : '73'}
                suffix={weightUnit}
              />
            </View>
            <View className="flex-row rounded-2xl border border-border bg-card overflow-hidden">
              {(['lbs', 'kg'] as const).map((u) => {
                const active = weightUnit === u;
                return (
                  <TouchableOpacity
                    key={u}
                    activeOpacity={0.75}
                    onPress={() => switchUnit(u)}
                    className={[
                      'px-4 justify-center',
                      active ? 'bg-primary' : 'bg-transparent',
                    ].join(' ')}
                  >
                    <Text
                      className={[
                        'text-sm font-semibold',
                        active ? 'text-primary-foreground' : 'text-muted-foreground',
                      ].join(' ')}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          {errors.weight && <Text className="text-xs text-destructive mt-1">{errors.weight}</Text>}
        </View>

        {/* Sex (optional) */}
        <View className="mb-2">
          <FieldLabel>Sex (optional)</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {SEX_OPTIONS.map((opt) => {
              const isSelected = sex === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  activeOpacity={0.75}
                  onPress={() => setSex(isSelected ? null : opt.value)}
                  className={[
                    'px-4 py-3 rounded-2xl border',
                    isSelected ? 'bg-primary border-primary' : 'bg-card border-border',
                  ].join(' ')}
                >
                  <Text
                    className={[
                      'text-sm font-semibold',
                      isSelected ? 'text-primary-foreground' : 'text-foreground',
                    ].join(' ')}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text className="text-xs text-muted-foreground mt-2">
            Helps refine BMR — pick what you're comfortable sharing.
          </Text>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View className="px-6 pb-8 pt-4 border-t border-border bg-background">
        <Button
          size="lg"
          disabled={!canContinue}
          className="w-full rounded-2xl"
          onPress={handleContinue}
        >
          Continue
        </Button>
        {!canContinue && (
          <Text className="text-xs text-center text-muted-foreground mt-2">
            Age, height, and weight are required
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
