import { useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaptureBar } from '@/components/scan/CaptureBar';
import { CondensedCard } from '@/components/scan/CondensedCard';
import { FoodLogCard } from '@/components/scan/FoodLogCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFoodStore } from '@/store/foodStore';

export default function ScanScreen() {
  const entries = useFoodStore((s) => s.entries);
  const addFromImage = useFoodStore((s) => s.addFromImage);

  const handleImagePicked = useCallback(
    (uri: string) => {
      void addFromImage(uri);
    },
    [addFromImage]
  );

  const [hero, ...history] = entries;

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
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <FoodLogCard entry={hero} />

          {history.length > 0 && (
            <View className="gap-2 mt-2">
              <Text className="text-xs font-semibold text-muted uppercase tracking-wide px-1">
                History
              </Text>
              {history.map((entry) => (
                <CondensedCard key={entry.id} entry={entry} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
