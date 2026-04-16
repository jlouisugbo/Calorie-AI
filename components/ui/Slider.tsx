import { useRef, useState } from 'react';
import { View, PanResponder } from 'react-native';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className = '',
}: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const thumbSize = 20;

  const clampAndStep = (raw: number): number => {
    const clamped = Math.min(max, Math.max(min, raw));
    const stepped = Math.round((clamped - min) / step) * step + min;
    return Math.min(max, Math.max(min, stepped));
  };

  const valueToOffset = (v: number): number => {
    if (trackWidth === 0) return 0;
    return ((v - min) / (max - min)) * trackWidth;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (trackWidth === 0) return;
        const rawValue = (gestureState.moveX / trackWidth) * (max - min) + min;
        onValueChange(clampAndStep(rawValue));
      },
      onPanResponderGrant: (event) => {
        if (trackWidth === 0) return;
        const rawValue = (event.nativeEvent.locationX / trackWidth) * (max - min) + min;
        onValueChange(clampAndStep(rawValue));
      },
    })
  ).current;

  const fillWidth = trackWidth > 0 ? valueToOffset(value) : 0;
  const thumbOffset = fillWidth - thumbSize / 2;

  return (
    <View className={`justify-center py-3 ${className}`}>
      <View
        className="h-2 bg-gray-200 rounded-full"
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View
          className="h-2 bg-primary rounded-full absolute top-0 left-0"
          style={{ width: fillWidth }}
        />
        <View
          className="w-5 h-5 rounded-full bg-primary shadow-md absolute"
          style={{
            left: thumbOffset,
            top: -(thumbSize / 2 - 4),
          }}
        />
      </View>
    </View>
  );
}
