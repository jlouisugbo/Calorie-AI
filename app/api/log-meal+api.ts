import { mealLogFieldsFromLogMealNutrition } from '@/lib/supabase/tools/logmeal/meal-log-map';
import { getServiceSupabase } from '@/lib/supabase/server';

const LOGMEAL_BASE = 'https://api.logmeal.com';

function logmealToken(): string {
  const token =
    process.env.LOGMEAL_API_KEY ??
    process.env.logmeal_api_key ??
    process.env.EXPO_PUBLIC_LOGMEAL_API_KEY;
  if (!token) throw new Error('LOGMEAL_API_KEY not set');
  return token;
}

async function segment(image: File, token: string) {
  const form = new FormData();
  form.append('image', image, 'meal.jpg');
  const res = await fetch(
    `${LOGMEAL_BASE}/v2/image/segmentation/complete?language=eng`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`segmentation ${res.status}: ${text}`);
  return JSON.parse(text) as { imageId: number };
}

async function nutrition(imageId: number, token: string) {
  const res = await fetch(
    `${LOGMEAL_BASE}/v2/nutrition/recipe/nutritionalInfo?language=eng`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageId }),
    },
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`nutrition ${res.status}: ${text}`);
  return JSON.parse(text);
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const image = form.get('image');
    const userId = form.get('user_id');

    if (!(image instanceof File)) {
      return Response.json({ error: 'Missing image' }, { status: 400 });
    }
    if (typeof userId !== 'string' || !userId) {
      return Response.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const token = logmealToken();
    const seg = await segment(image, token);
    const nut = await nutrition(seg.imageId, token);
    const fields = mealLogFieldsFromLogMealNutrition(nut);

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('meal_logs')
      .insert({ ...fields, user_id: userId })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ meal: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
