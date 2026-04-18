import { Modal as RNModal, View, Text, TouchableOpacity } from 'react-native';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

interface ModalSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function Modal({ visible, onClose, title, children, className = '' }: ModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        className="flex-1 bg-black/50 items-center justify-center"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          className={`bg-background rounded-2xl mx-4 p-6 w-full ${className}`}
          onPress={() => {}}
        >
          {title && (
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-text-base flex-1">{title}</Text>
              <TouchableOpacity onPress={onClose} className="ml-2 p-1" activeOpacity={0.7}>
                <Text className="text-muted text-base">✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </RNModal>
  );
}

export function ModalHeader({ children, className = '' }: ModalSectionProps) {
  return <View className={`mb-4 ${className}`}>{children}</View>;
}

export function ModalBody({ children, className = '' }: ModalSectionProps) {
  return <View className={`${className}`}>{children}</View>;
}

export function ModalFooter({ children, className = '' }: ModalSectionProps) {
  return (
    <View className={`mt-6 flex-row items-center justify-end gap-3 ${className}`}>{children}</View>
  );
}
