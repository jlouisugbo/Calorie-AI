import { LinearGradient } from 'expo-linear-gradient';
import { View, type ViewProps } from 'react-native';

type GradientDirection = 'horizontal' | 'vertical' | 'diagonal';

interface GradientPoint {
  x: number;
  y: number;
}

interface GradientProps extends ViewProps {
  colors?: string[];
  direction?: GradientDirection;
  children?: React.ReactNode;
  className?: string;
}

interface GlassCardProps {
  children?: React.ReactNode;
  className?: string;
}

function getPoints(direction: GradientDirection): {
  start: GradientPoint;
  end: GradientPoint;
} {
  switch (direction) {
    case 'vertical':
      return { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } };
    case 'horizontal':
      return { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } };
    case 'diagonal':
      return { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
  }
}

export function Gradient({
  colors = ['#4f46e5', '#7c3aed'],
  direction = 'vertical',
  children,
  className = '',
  style,
  ...props
}: GradientProps) {
  const { start, end } = getPoints(direction);

  return (
    <LinearGradient
      colors={colors as [string, string, ...string[]]}
      start={start}
      end={end}
      style={[{ flex: 1 }, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <View className={`bg-white/10 border border-white/20 rounded-2xl ${className}`}>
      {children}
    </View>
  );
}
