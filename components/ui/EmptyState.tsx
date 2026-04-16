import { View, Text } from 'react-native';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <View className={`flex-1 items-center justify-center px-8 py-12 ${className}`}>
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-lg font-semibold text-text-base text-center">{title}</Text>
      {description && (
        <Text className="text-sm text-muted mt-1 text-center">{description}</Text>
      )}
      {action && (
        <Button onPress={action.onPress} className="mt-6">
          {action.label}
        </Button>
      )}
    </View>
  );
}
