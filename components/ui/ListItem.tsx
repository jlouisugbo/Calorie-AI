import { View, Text, TouchableOpacity } from 'react-native';

interface ListItemProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export function ListItem({ title, subtitle, leading, trailing, onPress, className = '' }: ListItemProps) {
  const inner = (
    <>
      {leading && <View className="mr-3">{leading}</View>}
      <View className="flex-1">
        <Text className="text-sm font-medium text-text-base">{title}</Text>
        {subtitle && <Text className="text-xs text-muted mt-0.5">{subtitle}</Text>}
      </View>
      {trailing && <View className="ml-3">{trailing}</View>}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        className={`flex-row items-center py-3 px-4 border-b border-border ${className}`}
      >
        {inner}
      </TouchableOpacity>
    );
  }

  return (
    <View className={`flex-row items-center py-3 px-4 border-b border-border ${className}`}>
      {inner}
    </View>
  );
}
