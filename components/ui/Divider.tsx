import { View, Text } from 'react-native';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
}

export function Divider({ orientation = 'horizontal', label, className = '' }: DividerProps) {
  if (orientation === 'vertical') {
    return <View className={`w-px bg-border self-stretch ${className}`} />;
  }

  if (label) {
    return (
      <View className={`flex-row items-center ${className}`}>
        <View className="flex-1 h-px bg-border" />
        <Text className="mx-3 text-xs text-muted">{label}</Text>
        <View className="flex-1 h-px bg-border" />
      </View>
    );
  }

  return <View className={`h-px bg-border w-full ${className}`} />;
}
