import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function Switch({
  value,
  onValueChange,
  disabled = false,
  label,
  className = '',
}: SwitchProps) {
  const animValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value, animValue]);

  const thumbTranslateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26],
  });

  return (
    <TouchableOpacity
      onPress={() => !disabled && onValueChange(!value)}
      activeOpacity={0.8}
      className={`flex-row items-center gap-3 ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {label && <Text className="text-sm text-text-base">{label}</Text>}
      <View
        className={`w-12 h-6 rounded-full justify-center ${value ? 'bg-primary' : 'bg-gray-300'}`}
      >
        <Animated.View
          style={{ transform: [{ translateX: thumbTranslateX }] }}
          className="w-5 h-5 rounded-full bg-white shadow-sm"
        />
      </View>
    </TouchableOpacity>
  );
}
