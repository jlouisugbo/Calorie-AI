import { View, Text, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

interface CardSectionProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <View
      className={`bg-surface-elevated rounded-xl border border-border p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ className = '', children }: CardSectionProps) {
  return <View className={`mb-3 ${className}`}>{children}</View>;
}

export function CardTitle({ className = '', children }: CardSectionProps) {
  return <Text className={`text-lg font-semibold text-text-base ${className}`}>{children}</Text>;
}

export function CardContent({ className = '', children }: CardSectionProps) {
  return <View className={`${className}`}>{children}</View>;
}

export function CardFooter({ className = '', children }: CardSectionProps) {
  return <View className={`mt-4 flex-row items-center ${className}`}>{children}</View>;
}
