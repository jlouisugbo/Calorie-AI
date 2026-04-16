import { View, Text, TouchableOpacity } from 'react-native';

type ChipVariant = 'default' | 'primary';

interface ChipProps {
  children: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  variant?: ChipVariant;
  className?: string;
}

export function Chip({
  children,
  selected = false,
  onPress,
  onRemove,
  variant = 'default',
  className = '',
}: ChipProps) {
  const baseClasses = 'flex-row items-center rounded-full px-3 py-1.5';

  const colorClasses =
    selected || variant === 'primary'
      ? 'bg-primary'
      : 'bg-gray-100';

  const textColorClasses =
    selected || variant === 'primary'
      ? 'text-white'
      : 'text-gray-700';

  const content = (
    <>
      <Text className={`text-sm ${textColorClasses}`}>{children}</Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} className="ml-1.5" activeOpacity={0.7}>
          <Text className={`text-sm ${textColorClasses}`}>×</Text>
        </TouchableOpacity>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        className={`${baseClasses} ${colorClasses} ${className}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View className={`${baseClasses} ${colorClasses} ${className}`}>
      {content}
    </View>
  );
}
