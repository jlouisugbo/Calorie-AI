import { MotiView, type MotiTransitionProp } from 'moti';
import { type ViewProps } from 'react-native';

type SlideDirection = 'bottom' | 'top' | 'left' | 'right';

interface SlideViewProps extends ViewProps {
  children: React.ReactNode;
  from?: SlideDirection;
  distance?: number;
  delay?: number;
  duration?: number;
  className?: string;
}

interface SlideOutProps extends ViewProps {
  children: React.ReactNode;
  from?: SlideDirection;
  distance?: number;
  delay?: number;
  duration?: number;
  className?: string;
}

function getTranslate(direction: SlideDirection, distance: number) {
  switch (direction) {
    case 'bottom':
      return { translateY: distance };
    case 'top':
      return { translateY: -distance };
    case 'left':
      return { translateX: -distance };
    case 'right':
      return { translateX: distance };
  }
}

export function SlideView({
  children,
  from = 'bottom',
  distance = 24,
  delay = 0,
  duration,
  className = '',
  ...props
}: SlideViewProps) {
  const hiddenTranslate = getTranslate(from, distance);

  return (
    <MotiView
      from={{ opacity: 0, ...hiddenTranslate }}
      animate={{ opacity: 1, translateY: 0, translateX: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 180, delay } as MotiTransitionProp<any>}
      className={className}
      {...props}
    >
      {children}
    </MotiView>
  );
}

export function SlideOut({
  children,
  from = 'bottom',
  distance = 24,
  delay = 0,
  duration,
  className = '',
  ...props
}: SlideOutProps) {
  const exitTranslate = getTranslate(from, distance);

  return (
    <MotiView
      from={{ opacity: 1, translateY: 0, translateX: 0 }}
      animate={{ opacity: 0, ...exitTranslate }}
      transition={{ type: 'spring', damping: 18, stiffness: 180, delay } as MotiTransitionProp<any>}
      className={className}
      {...props}
    >
      {children}
    </MotiView>
  );
}
