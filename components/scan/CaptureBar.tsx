import { useCallback } from 'react';
import { View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/toastStore';

interface CaptureBarProps {
  onImagePicked: (uri: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CaptureBar({ onImagePicked, disabled = false, className = '' }: CaptureBarProps) {
  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      toast.error('Camera permission is required to scan meals');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImagePicked(result.assets[0].uri);
    }
  }, [onImagePicked]);

  const pickFromLibrary = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImagePicked(result.assets[0].uri);
    }
  }, [onImagePicked]);

  return (
    <View className={`flex-row gap-2 ${className}`}>
      <Button onPress={takePhoto} disabled={disabled} className="flex-1">
        Take photo
      </Button>
      <Button onPress={pickFromLibrary} disabled={disabled} variant="outline" className="flex-1">
        From library
      </Button>
    </View>
  );
}
