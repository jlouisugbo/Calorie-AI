import { View, Text, TouchableOpacity } from 'react-native';

type BannerVariant = 'info' | 'success' | 'warning' | 'error';

interface BannerProps {
  variant: BannerVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<
  BannerVariant,
  { container: string; title: string; message: string; border: string }
> = {
  info: {
    container: 'bg-blue-100 border-blue-700',
    title: 'text-blue-700',
    message: 'text-blue-700',
    border: 'border-blue-700',
  },
  success: {
    container: 'bg-green-100 border-green-700',
    title: 'text-green-700',
    message: 'text-green-700',
    border: 'border-green-700',
  },
  warning: {
    container: 'bg-yellow-100 border-yellow-700',
    title: 'text-yellow-700',
    message: 'text-yellow-700',
    border: 'border-yellow-700',
  },
  error: {
    container: 'bg-red-100 border-red-700',
    title: 'text-red-700',
    message: 'text-red-700',
    border: 'border-red-700',
  },
};

export function Banner({ variant, title, message, onDismiss, className = '' }: BannerProps) {
  const styles = variantStyles[variant];

  return (
    <View
      className={`flex-row items-start border-l-4 rounded-r-lg px-4 py-3 ${styles.container} ${className}`}
    >
      <View className="flex-1">
        {title && <Text className={`text-sm font-semibold mb-0.5 ${styles.title}`}>{title}</Text>}
        <Text className={`text-sm ${styles.message}`}>{message}</Text>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} className="ml-3 p-0.5" activeOpacity={0.7}>
          <Text className={`text-base ${styles.title}`}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
