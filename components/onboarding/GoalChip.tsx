import { TouchableOpacity, View, Text } from 'react-native';

interface GoalChipProps {
  icon: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function GoalChip({ icon, label, selected, onPress }: GoalChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className={[
        'flex-row items-center gap-3 rounded-2xl px-4 py-3.5 border',
        selected ? 'bg-primary border-primary' : 'bg-card border-border',
      ].join(' ')}
    >
      <Text className="text-2xl">{icon}</Text>
      <Text
        className={[
          'text-sm font-semibold flex-1',
          selected ? 'text-primary-foreground' : 'text-foreground',
        ].join(' ')}
      >
        {label}
      </Text>
      {selected && (
        <View className="w-5 h-5 rounded-full bg-primary-foreground/20 items-center justify-center">
          <Text className="text-primary-foreground text-xs">✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
