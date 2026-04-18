import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase/client';

const REDIRECT = Linking.createURL('auth-callback');

export interface GoogleSignInResult {
  ok: boolean;
  error?: string;
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: REDIRECT, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    return { ok: false, error: error?.message ?? 'No OAuth URL returned' };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT);
  if (result.type !== 'success' || !result.url) {
    return { ok: false, error: 'Sign-in cancelled' };
  }

  const url = new URL(result.url);
  const code = url.searchParams.get('code');
  if (!code) {
    return { ok: false, error: 'No auth code returned' };
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return { ok: false, error: exchangeError.message };
  }
  return { ok: true };
}
