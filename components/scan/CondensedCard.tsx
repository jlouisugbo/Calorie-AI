import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import type { FoodLogEntry } from '@/types';

interface CondensedCardProps {
  entry: FoodLogEntry;
  onPress?: () => void;
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

export function CondensedCard({ entry, onPress, className = '' }: CondensedCardProps) {
  const title = entry.dishName ?? (entry.status === 'analyzing' ? 'Analyzing…' : 'Untitled meal');

  const body = (
    <>
      <Image
        source={{ uri: entry.imageUri }}
        className="w-14 h-14 rounded-lg bg-muted"
        width={56}
        height={56}
      />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-text-base" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-xs text-muted mt-0.5">{timeAgo(entry.createdAt)}</Text>
      </View>
      {entry.status === 'done' && entry.nutrition?.calories !== undefined && (
        <View className="items-end">
          <Text className="text-base font-semibold text-text-base">
            {entry.nutrition.calories}
          </Text>
          <Text className="text-[10px] text-muted uppercase tracking-wide">cal</Text>
        </View>
      )}
      {entry.status === 'analyzing' && <Badge variant="default">Analyzing</Badge>}
      {entry.status === 'error' && <Badge variant="destructive">Error</Badge>}
    </>
  );

  const classes = `flex-row items-center gap-3 bg-surface-elevated rounded-xl border border-border p-3 ${className}`;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75} className={classes}>
        {body}
      </TouchableOpacity>
    );
  }

  return <View className={classes}>{body}</View>;
}
