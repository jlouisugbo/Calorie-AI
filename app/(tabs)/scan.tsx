import { useCallback, useRef } from 'react';
import { View, Text, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaptureBar } from '@/components/scan/CaptureBar';
import { FoodLogCard } from '@/components/scan/FoodLogCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFoodStore } from '@/store/foodStore';

const STEP = 90;
const FRONT_TOP_Y = 44;
const PEEK = 22;
const CARD_HEIGHT = 320;
const STACK_HEIGHT = FRONT_TOP_Y + CARD_HEIGHT + 24;
const EXIT_Y = STACK_HEIGHT + 80;
const MAX_PEEKS = 3;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ScanScreen() {
  const entries = useFoodStore((s) => s.entries);
  const addFromImage = useFoodStore((s) => s.addFromImage);
  const scrollY = useRef(new Animated.Value(0)).current;

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  const handleImagePicked = useCallback(
    (uri: string) => {
      scrollY.setValue(0);
      void addFromImage(uri);
    },
    [addFromImage, scrollY]
  );

  const scrollExtent = Math.max(0, entries.length - 1) * STEP;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 pt-3 pb-2">
        <Text className="text-3xl font-display text-text-base">Scan</Text>
        <Text className="text-sm text-muted mt-0.5">Log a meal with your camera</Text>
      </View>

      <View className="px-4 pb-3">
        <CaptureBar onImagePicked={handleImagePicked} />
      </View>

      {entries.length === 0 ? (
        <EmptyState
          title="No scans yet"
          description="Take a photo of your meal to get started."
        />
      ) : (
        <View className="flex-1 relative">
          <Animated.ScrollView
            onScroll={onScroll}
            scrollEventThrottle={16}
            snapToInterval={STEP}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            className="flex-1"
          >
            <View style={{ height: scrollExtent + SCREEN_HEIGHT }} />
          </Animated.ScrollView>

          <View
            className="absolute top-0 left-0 right-0"
            style={{ height: STACK_HEIGHT }}
            pointerEvents="none"
          >
            {entries.map((entry, index) => (
              <FoodLogCard
                key={entry.id}
                entry={entry}
                index={index}
                totalCount={entries.length}
                scrollY={scrollY}
                step={STEP}
                frontTopY={FRONT_TOP_Y}
                peek={PEEK}
                cardHeight={CARD_HEIGHT}
                exitY={EXIT_Y}
                maxPeeks={MAX_PEEKS}
              />
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
