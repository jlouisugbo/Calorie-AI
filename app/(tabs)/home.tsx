import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingVertical: 24 }}>
        <Text className="text-4xl font-display text-text-base mb-2">Baseplate</Text>
        <Text className="text-base font-sans text-muted mb-8">AI-powered mobile app</Text>

        <Card className="mb-4">
          <Text className="text-lg font-semibold text-text-base mb-1">AI Chat</Text>
          <Text className="text-sm text-muted mb-4">
            Have a conversation with Claude claude-sonnet-4-6.
          </Text>
          <Button onPress={() => router.push('/(tabs)/chat')}>Start chatting</Button>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
