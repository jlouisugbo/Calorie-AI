import { Text, View } from 'react-native';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Card } from '@/components/ui/Card';

interface StatCardProps {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  prefix,
  suffix,
  trend,
  trendLabel,
  icon,
  className = '',
}: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;
  const trendColor = isPositive ? 'text-green-500' : 'text-red-500';
  const trendArrow = isPositive ? '▲' : '▼';
  const trendAbs = trend !== undefined ? Math.abs(trend) : 0;

  return (
    <Card className={className}>
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </Text>
        {icon !== undefined && (
          <View className="ml-2">{icon}</View>
        )}
      </View>

      <View className="my-2">
        {typeof value === 'number' ? (
          <AnimatedNumber
            value={value}
            prefix={prefix}
            suffix={suffix}
            textClassName="text-3xl font-bold text-gray-900"
          />
        ) : (
          <Text className="text-3xl font-bold text-gray-900">
            {prefix}
            {value}
            {suffix}
          </Text>
        )}
      </View>

      {trend !== undefined && (
        <View className="flex-row items-center gap-1 mt-1">
          <Text className={`text-sm font-semibold ${trendColor}`}>
            {trendArrow} {trendAbs}%
          </Text>
          {trendLabel !== undefined && (
            <Text className="text-sm text-gray-500">{trendLabel}</Text>
          )}
        </View>
      )}
    </Card>
  );
}
