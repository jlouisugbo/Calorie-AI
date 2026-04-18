import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase/client';
import {
  fetchLatestBiomarkers,
  seedSampleBiomarkers,
  type BiomarkerRow,
} from '@/services/biomarkers';

interface BiomarkersCardProps {
  className?: string;
  /** Compact one-line display for the Home tab. Default false (full card). */
  compact?: boolean;
}

function findLatest<K extends keyof BiomarkerRow>(
  rows: BiomarkerRow[],
  key: K,
): BiomarkerRow[K] | null {
  for (const row of rows) {
    const value = row[key];
    if (value !== null && value !== undefined) return value;
  }
  return null;
}

interface StatProps {
  label: string;
  value: string | number | null;
  suffix?: string;
}

function Stat({ label, value, suffix }: StatProps) {
  return (
    <View className="items-center px-3">
      <Text className="text-[10px] uppercase font-semibold text-muted tracking-wide">
        {label}
      </Text>
      <Text className="text-base font-semibold text-text-base mt-0.5">
        {value == null ? '—' : `${value}${suffix ?? ''}`}
      </Text>
    </View>
  );
}

export function BiomarkersCard({ className = '', compact = false }: BiomarkersCardProps) {
  const [rows, setRows] = useState<BiomarkerRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        setRows([]);
        return;
      }
      const fetched = await fetchLatestBiomarkers(uid, 7);
      setRows(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load biomarkers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSeed() {
    if (!userId) {
      setError('Sign in to seed sample data.');
      return;
    }
    setSeeding(true);
    setError(null);
    try {
      await seedSampleBiomarkers(userId, 7);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seeding failed');
    } finally {
      setSeeding(false);
    }
  }

  const sleep = findLatest(rows, 'sleep_hours');
  const hrv = findLatest(rows, 'hrv_ms');
  const glucose = findLatest(rows, 'glucose_mg_dl');
  const rhr = findLatest(rows, 'resting_hr');
  const steps = findLatest(rows, 'steps');

  if (compact) {
    if (rows.length === 0) {
      return (
        <Card className={className}>
          <Text className="text-sm text-muted">
            {loading ? 'Loading biomarkers…' : 'No biomarker data yet.'}
          </Text>
          {!loading && (
            <View className="mt-3">
              <Button size="sm" onPress={() => void handleSeed()} loading={seeding}>
                Seed sample data
              </Button>
            </View>
          )}
        </Card>
      );
    }
    return (
      <Card className={className}>
        <Text className="text-sm font-semibold text-text-base mb-3">
          Today&apos;s snapshot
        </Text>
        <View className="flex-row justify-between">
          <Stat label="Sleep" value={sleep != null ? Number(sleep) : null} suffix="h" />
          <Stat label="HRV" value={hrv != null ? Number(hrv) : null} suffix="ms" />
          <Stat
            label="Glucose"
            value={glucose != null ? Number(glucose) : null}
            suffix=""
          />
          <Stat label="RHR" value={rhr != null ? Number(rhr) : null} suffix="" />
          <Stat label="Steps" value={steps != null ? Number(steps) : null} />
        </View>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-text-base">Biomarkers</Text>
        <Button
          variant="outline"
          size="sm"
          onPress={() => void handleSeed()}
          loading={seeding}
        >
          {rows.length === 0 ? 'Seed sample data' : 'Reseed sample'}
        </Button>
      </View>

      {rows.length === 0 ? (
        <Text className="text-sm text-muted">
          {loading
            ? 'Loading…'
            : 'No biomarker data yet — tap "Seed sample data" to populate a busy-pro week.'}
        </Text>
      ) : (
        <View className="flex-row justify-between">
          <Stat label="Sleep" value={sleep != null ? Number(sleep) : null} suffix="h" />
          <Stat label="HRV" value={hrv != null ? Number(hrv) : null} suffix="ms" />
          <Stat
            label="Glucose"
            value={glucose != null ? Number(glucose) : null}
            suffix=""
          />
          <Stat label="RHR" value={rhr != null ? Number(rhr) : null} suffix="" />
          <Stat label="Steps" value={steps != null ? Number(steps) : null} />
        </View>
      )}

      {error ? (
        <Text className="text-xs text-destructive mt-3">{error}</Text>
      ) : null}
    </Card>
  );
}
