import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

export type PieSlice = {
  value: number;
  label?: string;
  color: string;
  text?: string;
};

interface PieChartProps {
  data: PieSlice[];
  size?: number;
  donut?: boolean;
  showText?: boolean;
  centerLabel?: string;
  centerSubLabel?: string;
  title?: string;
  legend?: boolean;
  className?: string;
}

export function AppPieChart({
  data,
  size = 160,
  donut = true,
  showText = false,
  centerLabel,
  centerSubLabel,
  title,
  legend = true,
  className = '',
}: PieChartProps) {
  const innerRadius = size * 0.55;

  const centerContent =
    donut && centerLabel ? (
      <View className="items-center justify-center">
        <Text className="text-sm font-semibold text-text-base">{centerLabel}</Text>
        {centerSubLabel ? (
          <Text className="text-xs text-gray-400">{centerSubLabel}</Text>
        ) : null}
      </View>
    ) : undefined;

  return (
    <View className={className}>
      {title ? (
        <Text className="text-sm font-semibold text-text-base mb-2">{title}</Text>
      ) : null}
      <View className="items-center">
        <PieChart
          data={data}
          radius={size}
          donut={donut}
          innerRadius={donut ? innerRadius : undefined}
          showText={showText}
          centerLabelComponent={centerContent ? () => centerContent : undefined}
        />
      </View>
      {legend ? (
        <View className="flex-row flex-wrap justify-center mt-3 gap-3">
          {data.map((slice, index) => (
            <View key={index} className="flex-row items-center gap-1">
              <View
                style={{ backgroundColor: slice.color, width: 8, height: 8, borderRadius: 4 }}
              />
              <Text className="text-xs text-gray-400">{slice.label ?? slice.text ?? ''}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
