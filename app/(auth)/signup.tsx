import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase/client';
import { upsertProfile } from '@/lib/supabase/profile';

const MIN_PASSWORD_LENGTH = 6;

interface FormState {
  name: string;
  email: string;
  password: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = 'Please enter your name';
  if (!form.email.trim()) errors.email = 'Please enter your email';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address';
  }
  if (!form.password) errors.password = 'Please enter a password';
  else if (form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return errors;
}

const DEMO_EMAIL = 'demo@calorie-ai.com';
const DEMO_PASSWORD = 'demo1234';

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleDemoLogin() {
    setDemoLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });
      if (error) {
        setErrors({ form: 'Demo account unavailable. Ask a teammate to seed it.' });
        return;
      }
      router.replace('/(tabs)/home');
    } finally {
      setDemoLoading(false);
    }
  }

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
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      });

      if (error) {
        setErrors({ form: error.message });
        return;
      }

      const userId = data?.user?.id;
      if (!userId) {
        setErrors({ form: 'Could not create account. Please try again.' });
        return;
      }

      await upsertProfile(userId, { name: form.name.trim() });
      router.replace('/onboarding/step1-goals');
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
              Create your{'\n'}account
            </Text>
            <Text className="text-base font-sans text-muted-foreground leading-relaxed">
              No email verification needed — just sign up and go.
            </Text>
          </View>

          {/* Form */}
          <View className="gap-5 mb-6">
            <Input
              label="Name"
              placeholder="Alex Rivera"
              value={form.name}
              onChangeText={(v) => updateField('name', v)}
              error={errors.name}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              editable={!submitting}
            />

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
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              value={form.password}
              onChangeText={(v) => updateField('password', v)}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
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
            {submitting ? 'Creating account...' : 'Create account'}
          </Button>

          <View className="flex-1" />

          {/* Demo shortcut */}
          <Pressable
            onPress={handleDemoLogin}
            disabled={demoLoading || submitting}
            className="mt-6 py-3 items-center rounded-xl border border-dashed border-muted-foreground/40"
          >
            <Text className="text-sm font-medium text-muted-foreground">
              {demoLoading ? 'Signing in…' : '⚡ Skip — use demo account'}
            </Text>
          </Pressable>

          {/* Footer link */}
          <View className="flex-row justify-center items-center gap-1 mt-10">
            <Text className="text-sm text-muted-foreground font-sans">
              Already have an account?
            </Text>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              disabled={submitting}
              hitSlop={8}
            >
              <Text className="text-sm font-semibold text-primary">Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
