import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { registerPushToken } from '@/services/push';

// #region agent log
console.log('[AGENT_LOG] NotificationBootstrap module loaded, hasSetHandler=', typeof Notifications?.setNotificationHandler === 'function');
fetch('http://127.0.0.1:7767/ingest/47b8ec29-44cb-43f2-a14c-660f3b3d7b43',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b940fe'},body:JSON.stringify({sessionId:'b940fe',hypothesisId:'B',location:'NotificationBootstrap.tsx:module',message:'NotificationBootstrap module loaded',data:{hasNotifications:typeof Notifications?.setNotificationHandler==='function'},timestamp:Date.now()})}).catch(()=>{});
// #endregion

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  // #region agent log
  fetch('http://127.0.0.1:7767/ingest/47b8ec29-44cb-43f2-a14c-660f3b3d7b43',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b940fe'},body:JSON.stringify({sessionId:'b940fe',hypothesisId:'B',location:'NotificationBootstrap.tsx:setHandler',message:'setNotificationHandler ok',data:{},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
} catch (e) {
  // #region agent log
  fetch('http://127.0.0.1:7767/ingest/47b8ec29-44cb-43f2-a14c-660f3b3d7b43',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b940fe'},body:JSON.stringify({sessionId:'b940fe',hypothesisId:'B',location:'NotificationBootstrap.tsx:setHandler',message:'setNotificationHandler THREW',data:{err:String(e)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Calorie-AI',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4f46e5',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig
      ?.projectId;

  try {
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return token.data;
  } catch {
    return null;
  }
}

export function NotificationBootstrap() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const expoToken = await registerForPushNotificationsAsync();
      if (cancelled || !expoToken) return;
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (!userId) return;
        await registerPushToken({
          userId,
          expoToken,
          platform: Platform.OS,
        });
      } catch {
        // best-effort; ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | { deeplink?: string }
        | undefined;
      const deeplink = data?.deeplink;
      if (typeof deeplink === 'string' && deeplink.length > 0) {
        try {
          router.push(deeplink as never);
        } catch {
          // ignore unknown route
        }
      }
    });
    return () => sub.remove();
  }, [router]);

  return null;
}
