import { Tabs } from 'expo-router';
import { View, TouchableOpacity, Text, Modal } from 'react-native';
import { useState } from 'react';
import { NouriChat } from '@/components/NouriChat';

export default function TabLayout() {
  const [isNouriOpen, setIsNouriOpen] = useState(false);

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#4f46e5',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e5e7eb',
            paddingBottom: 4,
          },
        }}
      >
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      </Tabs>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setIsNouriOpen(true)}
        className="absolute bottom-24 right-4 w-16 h-16 bg-teal-600 rounded-full items-center justify-center shadow-lg"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 }}
      >
        <Text className="text-white text-2xl">🪄</Text>
      </TouchableOpacity>

      {/* Nouri Modal overlay */}
      <Modal
        visible={isNouriOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsNouriOpen(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="h-[85%] bg-white rounded-t-3xl shadow-xl overflow-hidden">
             <NouriChat onClose={() => setIsNouriOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
