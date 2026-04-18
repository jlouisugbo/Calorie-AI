import { View, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

export type DataPoint = {
  value: number;
  label?: string;
  dataPointText?: string;
};

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  areaChart?: boolean;
  curved?: boolean;
  showDots?: boolean;
  title?: string;
  className?: string;
}

export function AppLineChart({
  data,
  height = 200,
  color = '#4f46e5',
  areaChart = false,
  curved = true,
  showDots = true,
  title,
  className = '',
}: LineChartProps) {
  return (
    <View className={className}>
      {title ? <Text className="text-sm font-semibold text-text-base mb-2">{title}</Text> : null}
      <LineChart
        data={data}
        color={color}
        thickness={2}
        dataPointsColor={color}
        curved={curved}
        areaChart={areaChart}
        startFillColor={color + '33'}
        endFillColor={color + '00'}
        yAxisColor="#e5e7eb"
        xAxisColor="#e5e7eb"
        yAxisTextStyle={{ color: '#9ca3af', fontSize: 10 }}
        xAxisLabelTextStyle={{ color: '#9ca3af', fontSize: 10 }}
        height={height}
        hideDataPoints={!showDots}
      />
    </View>
  );
}
