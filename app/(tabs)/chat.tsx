import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAIStore } from '@/store/aiStore';

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const { messages, isLoading, sendMessage } = useAIStore();

  const SUGGESTIONS = [
    'What should I eat next?',
    'Am I on track today?',
    'High protein snack ideas',
    "I'm at an airport",
  ];

  const handleSend = (text: string) => {
    if (!text.trim() || isLoading) return;
    sendMessage(text);
    setInput('');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="flex-row items-center gap-3 px-4 py-4 border-b border-gray-100 bg-white">
          <View className="w-10 h-10 rounded-full bg-teal-50 items-center justify-center">
            <Text className="text-teal-600 text-lg">👤</Text>
          </View>
          <View>
            <Text className="text-lg font-bold text-gray-900">Nouri</Text>
            <Text className="text-sm text-teal-600">Your nutrition coach</Text>
          </View>
        </View>

        {/* Chat Area */}
        <ScrollView 
          ref={scrollRef}
          className="flex-1 px-4 pt-4 bg-white" 
          contentContainerStyle={{ paddingBottom: 20 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Initial Welcome Message */}
          {messages.length === 0 && (
            <View className="bg-[#F8F7F4] rounded-2xl p-4 mb-4 max-w-[85%]">
              <Text className="text-gray-800 text-base leading-6">
                Hey! I'm Nouri, your nutrition coach. I know your goals, your macros, and what you've eaten today. Ask me anything — what to eat, whether something fits your plan, or how to hit your targets tonight.
              </Text>
            </View>
          )}

          {/* Dynamic Messages */}
          {messages.map((msg) => (
            <View 
              key={msg.id} 
              className={`rounded-2xl p-4 mb-4 max-w-[85%] ${
                msg.role === 'user' ? 'bg-teal-600 self-end' : 'bg-[#F8F7F4] self-start'
              }`}
            >
              <Text className={`text-base leading-6 ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                {msg.content}
              </Text>
            </View>
          ))}

          {/* Loading State */}
          {isLoading && (
            <View className="bg-[#F8F7F4] rounded-2xl p-4 mb-4 max-w-[85%] self-start">
              <Text className="text-gray-500">Nouri is typing...</Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Area: Suggestions + Input */}
        <View className="px-4 pb-6 pt-2 bg-white border-t border-gray-100">
          
          {/* Quick Ask Chips (Only show if no messages sent yet) */}
          {messages.length === 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2 pr-4">
                {SUGGESTIONS.map((suggestion) => (
                  <TouchableOpacity 
                    key={suggestion}
                    onPress={() => handleSend(suggestion)}
                    className="px-4 py-2 rounded-full border border-gray-200 bg-white"
                  >
                    <Text className="text-gray-800">{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Input Bar */}
          <View className="flex-row items-center gap-2">
            <TextInput
              className="flex-1 bg-[#F4F6F8] border border-[#D1D5DB] rounded-xl px-4 py-3 text-base text-gray-900"
              placeholder="Ask Nouri anything..."
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              onPress={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className={`px-5 py-3 rounded-xl border ${
                !input.trim() || isLoading 
                  ? 'border-gray-200 bg-gray-50' 
                  : 'border-teal-600 bg-teal-600'
              }`}
            >
              <Text className={`font-semibold ${!input.trim() || isLoading ? 'text-gray-400' : 'text-white'}`}>
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
