import { View, Text, TouchableOpacity } from 'react-native';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onPress,
  label,
  disabled = false,
  className = '',
}: CheckboxProps) {
  return (
    <TouchableOpacity
      onPress={() => !disabled && onPress()}
      activeOpacity={0.7}
      className={`flex-row items-center gap-2 ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      <View
        className={`w-5 h-5 rounded border-2 items-center justify-center ${
          checked ? 'bg-primary border-primary' : 'bg-transparent border-gray-300'
        }`}
      >
        {checked && <Text className="text-white text-xs font-bold leading-none">✓</Text>}
      </View>
      {label && <Text className="text-sm text-text-base">{label}</Text>}
    </TouchableOpacity>
  );
}
