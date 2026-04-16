import { useEffect, useRef, useState } from 'react';
import { Animated, Text } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  textClassName?: string;
}

export function AnimatedNumber({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  decimals = 0,
  textClassName = '',
}: AnimatedNumberProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const currentValue = useRef(0);
  const [displayValue, setDisplayValue] = useState(
    decimals > 0 ? (0).toFixed(decimals) : '0'
  );

  useEffect(() => {
    const listenerId = animatedValue.addListener(({ value: v }) => {
      const formatted =
        decimals > 0 ? v.toFixed(decimals) : String(Math.round(v));
      setDisplayValue(formatted);
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start(() => {
      animatedValue.removeListener(listenerId);
      currentValue.current = value;
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [value, duration, decimals]);

  return (
    <Text className={textClassName}>
      {prefix}
      {displayValue}
      {suffix}
    </Text>
  );
}
