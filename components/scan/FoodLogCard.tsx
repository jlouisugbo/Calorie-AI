import { View, Text, Image } from 'react-native';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { NutritionGrid } from '@/components/scan/NutritionGrid';
import { useFoodStore } from '@/store/foodStore';
import type { FoodLogEntry } from '@/types';

interface FoodLogCardProps {
  entry: FoodLogEntry;
  className?: string;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}

export function FoodLogCard({ entry, className = '' }: FoodLogCardProps) {
  const retry = useFoodStore((s) => s.retry);

  const title =
    entry.dishName ?? (entry.status === 'analyzing' ? 'Analyzing…' : 'Untitled meal');

  return (
    <View
      className={`bg-surface-elevated rounded-2xl border border-border overflow-hidden ${className}`}
    >
      <Image
        source={{ uri: entry.imageUri }}
        className="w-full h-44 bg-muted"
        resizeMode="cover"
      />
      <View className="p-4 gap-3">
        <View>
          <Text className="text-lg font-semibold text-text-base" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-xs text-muted mt-0.5">{timeAgo(entry.createdAt)}</Text>
        </View>

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
  );
}
