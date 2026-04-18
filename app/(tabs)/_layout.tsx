import { Tabs } from 'expo-router';
import { View, TouchableOpacity, Text, Modal } from 'react-native';
import { useState } from 'react';
import { NouriChat } from '@/components/NouriChat';
import CustomTabBar from '../../components/navigation/CustomTabBar';

export default function TabLayout() {
  const [isNouriOpen, setIsNouriOpen] = useState(false);

  return (
    <View className="flex-1">
      <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
        <Tabs.Screen name="log" options={{ title: 'Log' }} />
        <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setIsNouriOpen(true)}
        className="absolute bottom-28 right-4 w-16 h-16 bg-teal-600 rounded-full items-center justify-center shadow-lg"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8, zIndex: 50 }}
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
