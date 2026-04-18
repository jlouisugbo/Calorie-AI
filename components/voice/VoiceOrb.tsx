import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export type VoiceOrbState = 'idle' | 'recording' | 'thinking' | 'speaking';

const STATE_COLOR: Record<VoiceOrbState, string> = {
  idle: '#4f46e5',
  recording: '#ef4444',
  thinking: '#f59e0b',
  speaking: '#10b981',
};

const STATE_LABEL: Record<VoiceOrbState, string> = {
  idle: 'Hold to talk',
  recording: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking',
};

interface VoiceOrbProps {
  state: VoiceOrbState;
  onPressIn: () => void;
  onPressOut: () => void;
  disabled?: boolean;
}

export function VoiceOrb({ state, onPressIn, onPressOut, disabled }: VoiceOrbProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (state === 'recording' || state === 'speaking' || state === 'thinking') {
      pulse.value = withRepeat(
        withTiming(1.18, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [state, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const color = STATE_COLOR[state];

  return (
    <View className="items-center">
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={STATE_LABEL[state]}
      >
        <Animated.View
          style={[
            {
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: color,
              opacity: disabled ? 0.5 : 1,
              shadowColor: color,
              shadowOpacity: 0.4,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 12 },
              elevation: 8,
            },
            animatedStyle,
          ]}
        />
      </Pressable>
      <Text className="text-base font-semibold text-text-base mt-6">
        {STATE_LABEL[state]}
      </Text>
    </View>
  );
}
