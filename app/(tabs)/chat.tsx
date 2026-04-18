import { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAIStore } from '@/store/aiStore';
import { useLocationStore } from '@/store/locationStore';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const { messages, isLoading, error, sendMessage } = useAIStore();
  const coords = useLocationStore((s) => s.coords);
  const permissionStatus = useLocationStore((s) => s.permissionStatus);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    await sendMessage(text);
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View className="px-4 py-3 border-b border-border">
          <Text className="text-lg font-semibold text-text-base">Claude</Text>
          <Text className="text-xs text-muted mt-0.5">
            {coords
              ? `Near ${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`
              : permissionStatus === 'denied'
                ? 'Location off'
                : 'Locating…'}
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <Text className="text-center text-muted mt-8">
              Send a message to start the conversation.
            </Text>
          )}

          {messages.map((msg) => (
            <View
              key={msg.id}
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                msg.role === 'user'
                  ? 'self-end bg-primary'
                  : 'self-start bg-surface border border-border'
              }`}
            >
              <Text
                className={`text-sm leading-5 ${
                  msg.role === 'user' ? 'text-white' : 'text-text-base'
                }`}
              >
                {msg.content}
              </Text>
            </View>
          ))}

          {isLoading && (
            <View className="self-start max-w-[85%]">
              <Skeleton className="h-10 w-48 rounded-lg" />
            </View>
          )}

          {error && (
            <View className="bg-red-100 rounded-lg px-4 py-3 border border-red-200">
              <Text className="text-sm text-red-700">{error}</Text>
            </View>
          )}
        </ScrollView>

        <View className="flex-row items-end gap-2 px-4 py-3 border-t border-border">
          <TextInput
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-base max-h-32"
            placeholder="Message Claude…"
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={handleSend}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
            className={`rounded-xl px-4 py-3 ${
              !input.trim() || isLoading ? 'bg-gray-200' : 'bg-primary'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text
                className={`text-sm font-medium ${!input.trim() ? 'text-muted' : 'text-white'}`}
              >
                Send
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
