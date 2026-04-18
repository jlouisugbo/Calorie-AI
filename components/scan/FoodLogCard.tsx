import { View, Text, Image, Animated } from 'react-native';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { NutritionGrid } from '@/components/scan/NutritionGrid';
import { useFoodStore } from '@/store/foodStore';
import type { FoodLogEntry } from '@/types';

interface FoodLogCardProps {
  entry: FoodLogEntry;
  index: number;
  totalCount: number;
  scrollY: Animated.Value;
  step: number;
  frontTopY: number;
  peek: number;
  cardHeight: number;
  exitY: number;
  maxPeeks: number;
}

export function FoodLogCard({
  entry,
  index,
  totalCount,
  scrollY,
  step,
  frontTopY,
  peek,
  cardHeight,
  exitY,
  maxPeeks,
}: FoodLogCardProps) {
  const retry = useFoodStore((s) => s.retry);

  // relPos = index - scrollY/step. Implemented via Animated math.
  const relPos = Animated.multiply(
    Animated.subtract(scrollY, index * step),
    -1 / step
  );

  // Scale per stack depth
  const scaleAt = [1, 1, 0.94, 0.88, 0.82, 0.76];

  const scale = relPos.interpolate({
    inputRange: [-1, 0, 1, 2, 3, maxPeeks + 1],
    outputRange: scaleAt,
    extrapolate: 'clamp',
  });

  // Base translateY at each breakpoint, with scale-origin compensation baked in
  // (center-origin scaling shifts visual top down by (1-scale)*H/2).
  const topAt = [
    exitY,
    frontTopY,
    frontTopY - peek,
    frontTopY - 2 * peek,
    frontTopY - 3 * peek,
    frontTopY - 3 * peek,
  ];
  const compensatedTop = topAt.map((t, i) => t - ((1 - scaleAt[i]) * cardHeight) / 2);

  const translateY = relPos.interpolate({
    inputRange: [-1, 0, 1, 2, 3, maxPeeks + 1],
    outputRange: compensatedTop,
    extrapolate: 'clamp',
  });

  const opacity = relPos.interpolate({
    inputRange: [-1, -0.5, 0, maxPeeks, maxPeeks + 1],
    outputRange: [0, 0, 1, 1, 0],
    extrapolate: 'clamp',
  });

  const title =
    entry.dishName ?? (entry.status === 'analyzing' ? 'Analyzing…' : 'Untitled meal');

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 16,
          right: 16,
          height: cardHeight,
          zIndex: totalCount - index,
        },
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      <View
        className="flex-1 bg-surface-elevated rounded-2xl border border-border overflow-hidden"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <Image
          source={{ uri: entry.imageUri }}
          className="w-full h-36 bg-muted"
          resizeMode="cover"
        />
        <View className="flex-1 p-4 gap-3">
          <Text className="text-lg font-semibold text-text-base" numberOfLines={1}>
            {title}
          </Text>

          {entry.status === 'analyzing' && (
            <View className="gap-3">
              <Skeleton className="h-10 w-32 self-center" />
              <SkeletonText lines={2} />
            </View>
          )}

          {entry.status === 'done' && entry.nutrition && (
            <NutritionGrid nutrition={entry.nutrition} />
          )}

          {entry.status === 'error' && (
            <View className="gap-3">
              <Banner
                variant="error"
                title="Couldn't analyze this image"
                message={entry.error ?? 'Please try again.'}
              />
              <Button onPress={() => retry(entry.id)} size="sm" variant="outline">
                Retry
              </Button>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
