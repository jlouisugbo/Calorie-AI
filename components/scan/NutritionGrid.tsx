import { View, Text } from 'react-native';
import type { Nutrition } from '@/types';

interface NutritionGridProps {
  nutrition: Nutrition;
  className?: string;
}

interface MacroCellProps {
  label: string;
  value: number | undefined;
  unit: string;
}

function MacroCell({ label, value, unit }: MacroCellProps) {
  return (
    <View className="flex-1 items-center py-2">
      <Text className="text-lg font-semibold text-text-base">
        {value !== undefined ? value : '—'}
        {value !== undefined && <Text className="text-xs text-muted">{unit}</Text>}
      </Text>
      <Text className="text-[10px] font-medium text-muted uppercase tracking-wide mt-0.5">
        {label}
      </Text>
    </View>
  );
}

export function NutritionGrid({ nutrition, className = '' }: NutritionGridProps) {
  return (
    <View className={`gap-2 ${className}`}>
      <View className="items-center py-2">
        <Text className="text-4xl font-display-xl text-text-base">
          {nutrition.calories ?? '—'}
        </Text>
        <Text className="text-xs font-medium text-muted uppercase tracking-wide mt-0.5">
          calories
        </Text>
      </View>

      <View className="flex-row border-t border-border pt-2">
        <MacroCell label="Protein" value={nutrition.protein_g} unit="g" />
        <View className="w-px bg-border" />
        <MacroCell label="Carbs" value={nutrition.carbs_g} unit="g" />
        <View className="w-px bg-border" />
        <MacroCell label="Fat" value={nutrition.fat_g} unit="g" />
        {nutrition.fiber_g !== undefined && (
          <>
            <View className="w-px bg-border" />
            <MacroCell label="Fiber" value={nutrition.fiber_g} unit="g" />
          </>
        )}
      </View>
    </View>
  );
}
