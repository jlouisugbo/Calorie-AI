import { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { useToastStore, type Toast, type ToastType } from '@/store/toastStore';

const typeStyles: Record<ToastType, { container: string; text: string; dot: string }> = {
  success: { container: 'bg-green-600', text: 'text-white', dot: 'bg-green-300' },
  error: { container: 'bg-red-600', text: 'text-white', dot: 'bg-red-300' },
  warning: { container: 'bg-yellow-500', text: 'text-white', dot: 'bg-yellow-200' },
  info: { container: 'bg-gray-900', text: 'text-white', dot: 'bg-gray-400' },
};

function ToastItem({ toast }: { toast: Toast }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const { dismiss } = useToastStore();
  const s = typeStyles[toast.type];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true, damping: 20 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20 }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        onPress={() => dismiss(toast.id)}
        activeOpacity={0.9}
        className={`flex-row items-center gap-3 rounded-xl px-4 py-3 mb-2 shadow-lg ${s.container}`}
      >
        <View className={`w-2 h-2 rounded-full ${s.dot}`} />
        <Text className={`flex-1 text-sm font-medium ${s.text}`}>{toast.message}</Text>
        <Text className={`text-xs ${s.text} opacity-70`}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <View className="absolute top-14 left-4 right-4 z-50" pointerEvents="box-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </View>
  );
}
