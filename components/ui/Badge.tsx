import { View, Text } from 'react-native';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: 'bg-indigo-100', text: 'text-indigo-700' },
  secondary: { container: 'bg-gray-100', text: 'text-gray-700' },
  success: { container: 'bg-green-100', text: 'text-green-700' },
  warning: { container: 'bg-yellow-100', text: 'text-yellow-700' },
  destructive: { container: 'bg-red-100', text: 'text-red-700' },
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const v = variantStyles[variant];
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${v.container} ${className}`}>
      <Text className={`text-xs font-medium ${v.text}`}>{children}</Text>
    </View>
  );
}
