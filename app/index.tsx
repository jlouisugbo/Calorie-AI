import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { getProfile } from '@/lib/supabase/profile';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    async function checkProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      // No auth session → signup (user must authenticate before onboarding)
      if (!userId) {
        router.replace('/(auth)/signup');
        return;
      }

      const profile = await getProfile(userId);
      if (profile) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/onboarding/step1-goals');
      }
    }

    checkProfile();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#3c6e21" />
    </View>
  );
}
