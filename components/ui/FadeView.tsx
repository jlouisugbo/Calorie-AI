import { MotiView } from 'moti';
import { type ViewProps } from 'react-native';

interface FadeViewProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

interface FadeOutProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeView({
  children,
  delay = 0,
  duration = 400,
  className = '',
  ...props
}: FadeViewProps) {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </MotiView>
  );
}

export function FadeOut({
  children,
  delay = 0,
  duration = 400,
  className = '',
  ...props
}: FadeOutProps) {
  return (
    <MotiView
      from={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ type: 'timing', duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </MotiView>
  );
}
