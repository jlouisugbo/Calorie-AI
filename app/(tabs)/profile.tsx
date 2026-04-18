import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Text className="font-display text-2xl text-primary">Profile</Text>
        <Text className="font-sans text-muted mt-2">Settings &amp; history</Text>
      </View>
    </SafeAreaView>
  );
}
