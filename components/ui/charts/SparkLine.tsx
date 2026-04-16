import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  positive?: boolean;
  className?: string;
}

export function SparkLine({
  data,
  width = 80,
  height = 32,
  color = '#4f46e5',
  positive,
  className = '',
}: SparkLineProps) {
  const finalColor =
    positive === true ? '#16a34a' : positive === false ? '#dc2626' : color;

  if (data.length === 0) {
    return <View className={className} style={{ width, height }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  return (
    <View className={className}>
      <Svg width={width} height={height}>
        <Path d={d} stroke={finalColor} strokeWidth={1.5} fill="none" />
      </Svg>
    </View>
  );
}
