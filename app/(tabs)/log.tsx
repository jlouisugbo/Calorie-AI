import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LogScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Text className="font-display text-2xl text-primary">Log Meal</Text>
        <Text className="font-sans text-muted mt-2">Camera coming soon</Text>
      </View>
    </SafeAreaView>
  );
}
