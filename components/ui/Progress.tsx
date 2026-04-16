import { useEffect, useRef } from 'react';
import { Animated, View, Text } from 'react-native';

interface ProgressProps {
  value: number;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  showLabel?: boolean;
}

export function Progress({
  value,
  className = '',
  trackClassName = '',
  fillClassName = '',
  showLabel = false,
}: ProgressProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: Math.min(100, Math.max(0, value)),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className={`flex-row items-center gap-2 ${className}`}>
      <View className={`flex-1 h-2 bg-gray-200 rounded-full overflow-hidden ${trackClassName}`}>
        <Animated.View
          className={`h-full bg-primary rounded-full ${fillClassName}`}
          style={{ width: widthInterpolation }}
        />
      </View>
      {showLabel && (
        <Text className="text-xs text-muted w-9 text-right">{value}%</Text>
      )}
    </View>
  );
}
