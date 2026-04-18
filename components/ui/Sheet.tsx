import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  type ViewProps,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  snapHeight?: number;
  children: React.ReactNode;
  className?: string;
}

interface SheetSectionProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

export function Sheet({
  visible,
  onClose,
  title,
  snapHeight = SCREEN_HEIGHT * 0.5,
  children,
  className = '',
}: SheetProps) {
  const translateY = useRef(new Animated.Value(snapHeight)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : snapHeight,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [visible, snapHeight, translateY]);

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <TouchableOpacity className="flex-1 bg-black/40" activeOpacity={1} onPress={onClose} />
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: snapHeight,
            transform: [{ translateY }],
          },
        ]}
        className={`bg-background rounded-t-2xl ${className}`}
      >
        <View className="w-10 h-1 bg-gray-300 rounded-full self-center mt-3 mb-2" />
        {title && (
          <View className="px-4 py-3 border-b border-border">
            <Text className="text-base font-semibold text-text-base">{title}</Text>
          </View>
        )}
        <View className="flex-1 px-4 py-4">{children}</View>
      </Animated.View>
    </Modal>
  );
}

export function SheetContent({ className = '', children, ...props }: SheetSectionProps) {
  return (
    <View className={`flex-1 ${className}`} {...props}>
      {children}
    </View>
  );
}
