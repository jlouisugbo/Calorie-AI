import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { getProfile } from '@/lib/supabase/profile';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    async function checkProfile() {
      // #region agent log
      fetch('http://127.0.0.1:7767/ingest/47b8ec29-44cb-43f2-a14c-660f3b3d7b43',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b940fe'},body:JSON.stringify({sessionId:'b940fe',hypothesisId:'C',location:'app/index.tsx:checkProfile',message:'checkProfile entry',data:{},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        // #region agent log
        fetch('http://127.0.0.1:7767/ingest/47b8ec29-44cb-43f2-a14c-660f3b3d7b43',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b940fe'},body:JSON.stringify({sessionId:'b940fe',hypothesisId:'C',location:'app/index.tsx:checkProfile',message:'getSession ok',data:{hasUserId:!!userId},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        if (!userId) {
          router.replace('/(auth)/signup');
          return;
        }

        const profile = await getProfile(userId);
        // #region agent log
        fetch('http://127.0.0.1:7767/ingest/47b8ec29-44cb-43f2-a14c-660f3b3d7b43',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b940fe'},body:JSON.stringify({sessionId:'b940fe',hypothesisId:'C',location:'app/index.tsx:checkProfile',message:'getProfile ok',data:{hasProfile:!!profile},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (profile) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/onboarding/step1-goals');
        }
      } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7767/ingest/47b8ec29-44cb-43f2-a14c-660f3b3d7b43',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b940fe'},body:JSON.stringify({sessionId:'b940fe',hypothesisId:'C',location:'app/index.tsx:checkProfile',message:'checkProfile THREW',data:{err:String(e)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
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
