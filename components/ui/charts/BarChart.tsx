import { View, Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

export type BarDataPoint = {
  value: number;
  label?: string;
  frontColor?: string;
};

interface BarChartProps {
  data: BarDataPoint[];
  height?: number;
  color?: string;
  title?: string;
  barBorderRadius?: number;
  className?: string;
}

export function AppBarChart({
  data,
  height = 200,
  color = '#4f46e5',
  title,
  barBorderRadius = 4,
  className = '',
}: BarChartProps) {
  const processedData = data.map((item) => ({
    ...item,
    frontColor: item.frontColor ?? color,
  }));

  return (
    <View className={className}>
      {title ? (
        <Text className="text-sm font-semibold text-text-base mb-2">{title}</Text>
      ) : null}
      <BarChart
        data={processedData}
        barBorderRadius={barBorderRadius}
        height={height}
        yAxisColor="#e5e7eb"
        xAxisColor="#e5e7eb"
        yAxisTextStyle={{ color: '#9ca3af', fontSize: 10 }}
        xAxisLabelTextStyle={{ color: '#9ca3af', fontSize: 10 }}
      />
    </View>
  );
}
