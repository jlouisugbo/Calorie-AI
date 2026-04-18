import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase/client';
import { getProfile } from '@/lib/supabase/profile';

interface FormState {
  email: string;
  password: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
  form?: string;
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.email.trim()) errors.email = 'Please enter your email';
  if (!form.password) errors.password = 'Please enter your password';
  return errors;
}

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key] || errors.form) {
      setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }));
    }
  }

  async function handleSubmit() {
    const validation = validate(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      if (error) {
        setErrors({ form: error.message });
        return;
      }

      const userId = data?.user?.id;
      if (!userId) {
        setErrors({ form: 'Could not sign in. Please try again.' });
        return;
      }

      const profile = await getProfile(userId);
      if (profile) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/onboarding/step1-goals');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand mark */}
          <View className="mb-10 flex-row items-center gap-2">
            <View className="h-8 w-8 rounded-xl bg-primary items-center justify-center">
              <Text className="text-white font-display text-lg">C</Text>
            </View>
            <Text className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
              Calorie-AI
            </Text>
          </View>

          {/* Headline */}
          <View className="mb-8">
            <Text className="text-4xl font-display text-foreground mb-3 leading-tight">
              Welcome{'\n'}back
            </Text>
            <Text className="text-base font-sans text-muted-foreground leading-relaxed">
              Sign in to pick up where you left off.
            </Text>
          </View>

          {/* Form */}
          <View className="gap-5 mb-6">
            <Input
              label="Email"
              placeholder="you@example.com"
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!submitting}
            />

            <Input
              label="Password"
              placeholder="Your password"
              value={form.password}
              onChangeText={(v) => updateField('password', v)}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              editable={!submitting}
            />

            {errors.form && (
              <View className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2">
                <Text className="text-sm text-destructive">{errors.form}</Text>
              </View>
            )}
          </View>

          <Button
            size="lg"
            loading={submitting}
            disabled={submitting}
            className="w-full rounded-2xl"
            onPress={handleSubmit}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>

          <View className="flex-1" />

          {/* Footer link */}
          <View className="flex-row justify-center items-center gap-1 mt-10">
            <Text className="text-sm text-muted-foreground font-sans">
              Don{'\u2019'}t have an account?
            </Text>
            <Pressable
              onPress={() => router.replace('/(auth)/signup')}
              disabled={submitting}
              hitSlop={8}
            >
              <Text className="text-sm font-semibold text-primary">Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
