import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { VoiceOrb, type VoiceOrbState } from '@/components/voice/VoiceOrb';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { transcribeAudio, synthesizeSpeech } from '@/services/voice';
import { runAgentTurn } from '@/services/ai';
import { useLocationStore } from '@/store/locationStore';
import { supabase } from '@/lib/supabase/client';
import type { AnthropicMessage } from '@/types';

interface VoiceTurn {
  id: string;
  user: string;
  assistant: string | null;
  toolCalls: string[];
}

const RECORDING_PRESET = Audio.RecordingOptionsPresets.HIGH_QUALITY;

export default function VoiceScreen() {
  const [orbState, setOrbState] = useState<VoiceOrbState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const conversationRef = useRef<AnthropicMessage[]>([]);

  const coords = useLocationStore((s) => s.coords);

  useEffect(() => {
    return () => {
      void soundRef.current?.unloadAsync();
      void recordingRef.current?.stopAndUnloadAsync().catch(() => undefined);
    };
  }, []);

  async function ensurePermission(): Promise<boolean> {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      setError('Microphone permission denied.');
      return false;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    return true;
  }

  async function handlePressIn() {
    setError(null);
    if (orbState !== 'idle') return;
    const ok = await ensurePermission();
    if (!ok) return;
    try {
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(RECORDING_PRESET);
      await recording.startAsync();
      recordingRef.current = recording;
      setOrbState('recording');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setOrbState('idle');
    }
  }

  async function handlePressOut() {
    if (orbState !== 'recording') return;
    setOrbState('thinking');
    const recording = recordingRef.current;
    recordingRef.current = null;
    if (!recording) {
      setOrbState('idle');
      return;
    }
    let uri: string | null = null;
    try {
      await recording.stopAndUnloadAsync();
      uri = recording.getURI();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      setOrbState('idle');
      return;
    }
    if (!uri) {
      setOrbState('idle');
      return;
    }

    try {
      const transcript = await transcribeAudio({ uri, mimeType: 'audio/m4a' });
      const userText = transcript.trim();
      if (!userText) {
        setError("Didn't catch that — try again.");
        setOrbState('idle');
        return;
      }

      const turnId = `${Date.now()}`;
      setTurns((prev) => [
        ...prev,
        { id: turnId, user: userText, assistant: null, toolCalls: [] },
      ]);

      conversationRef.current.push({ role: 'user', content: userText });
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? null;

      const result = await runAgentTurn({
        messages: conversationRef.current,
        userId,
        coords: coords
          ? {
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy: coords.accuracy,
              timestamp: coords.timestamp,
            }
          : null,
      });

      conversationRef.current.push({ role: 'assistant', content: result.text });

      setTurns((prev) =>
        prev.map((t) =>
          t.id === turnId
            ? {
                ...t,
                assistant: result.text,
                toolCalls: result.trace?.toolCalls.map((c) => c.name) ?? [],
              }
            : t,
        ),
      );

      setOrbState('speaking');
      await playSpeech(result.text);
      setOrbState('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Voice turn failed');
      setOrbState('idle');
    }
  }

  async function playSpeech(text: string) {
    try {
      const { audioBase64, format } = await synthesizeSpeech(text);
      const filePath = `${FileSystem.cacheDirectory}reply-${Date.now()}.${format}`;
      await FileSystem.writeAsStringAsync(filePath, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await soundRef.current?.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri: filePath });
      soundRef.current = sound;
      await sound.playAsync();
      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) resolve();
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audio playback failed');
    }
  }

  const reset = () => {
    conversationRef.current = [];
    setTurns([]);
    setError(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-display text-text-base">Voice coach</Text>
          <Text className="text-xs text-muted mt-0.5">
            {coords
              ? `Near ${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`
              : 'Locating…'}
          </Text>
        </View>
        <Button variant="outline" size="sm" onPress={reset}>
          Reset
        </Button>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
      >
        {turns.length === 0 ? (
          <Card>
            <Text className="text-sm text-muted leading-5">
              Hold the orb and say something like{' '}
              <Text className="text-text-base font-semibold">
                "I'm in LAX and need food, where do I go?"
              </Text>{' '}
              or{' '}
              <Text className="text-text-base font-semibold">
                "What should I eat before my 4pm meeting?"
              </Text>
            </Text>
          </Card>
        ) : (
          turns.map((t) => (
            <View key={t.id} className="gap-2">
              <View className="self-end max-w-[85%] rounded-lg px-4 py-3 bg-primary">
                <Text className="text-sm text-white leading-5">{t.user}</Text>
              </View>
              {t.assistant ? (
                <View className="self-start max-w-[85%] rounded-lg px-4 py-3 bg-surface border border-border">
                  <Text className="text-sm text-text-base leading-5">{t.assistant}</Text>
                  {t.toolCalls.length > 0 ? (
                    <Text className="text-[10px] text-muted mt-2 font-mono">
                      tools: {t.toolCalls.join(', ')}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <View className="self-start max-w-[85%] rounded-lg px-4 py-3 bg-surface border border-border">
                  <Text className="text-sm text-muted">…</Text>
                </View>
              )}
            </View>
          ))
        )}
        {error ? (
          <View className="bg-red-100 rounded-lg px-4 py-3 border border-red-200">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="px-4 pb-10 pt-4 items-center">
        <VoiceOrb
          state={orbState}
          onPressIn={() => void handlePressIn()}
          onPressOut={() => void handlePressOut()}
        />
      </View>
    </SafeAreaView>
  );
}
