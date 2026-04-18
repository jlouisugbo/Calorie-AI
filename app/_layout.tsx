import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { View, Text } from 'react-native';
import { ToastContainer } from '@/components/ui/Toast';
import { LocationBootstrap } from '@/components/location/LocationBootstrap';
import { NotificationBootstrap } from '@/components/notifications/NotificationBootstrap';

// #region agent log
console.log('[AGENT_LOG] _layout module loaded');
fetch('http://127.0.0.1:7767/ingest/47b8ec29-44cb-43f2-a14c-660f3b3d7b43',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b940fe'},body:JSON.stringify({sessionId:'b940fe',hypothesisId:'D',location:'app/_layout.tsx:module',message:'_layout module loaded',data:{},timestamp:Date.now()})}).catch(()=>{});
// #endregion

export default function RootLayout() {
  // #region agent log
  fetch('http://127.0.0.1:7767/ingest/47b8ec29-44cb-43f2-a14c-660f3b3d7b43',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b940fe'},body:JSON.stringify({sessionId:'b940fe',hypothesisId:'D',location:'app/_layout.tsx:RootLayout',message:'RootLayout render entry',data:{},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  const [fontsLoaded, fontsError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Syne_700Bold,
    Syne_800ExtraBold,
    JetBrainsMono_400Regular,
  });

  // #region agent log
  fetch('http://127.0.0.1:7767/ingest/47b8ec29-44cb-43f2-a14c-660f3b3d7b43',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b940fe'},body:JSON.stringify({sessionId:'b940fe',hypothesisId:'A',location:'app/_layout.tsx:useFonts',message:'fonts hook state',data:{fontsLoaded,fontsError:fontsError?String(fontsError):null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted">Loading…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <LocationBootstrap />
      <NotificationBootstrap />
      <Stack screenOptions={{ headerShown: false }} />
      <ToastContainer />
    </SafeAreaProvider>
  );
}
