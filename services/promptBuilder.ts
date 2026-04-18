import { Profile } from '../lib/supabase/types';

export type PromptMode = 'coach';

export function getSystemPrompt(mode: PromptMode, profile: Profile | null, mealLogs: any[] = []): string {
  if (!profile) {
    return 'You are a helpful AI assistant. The user profile is still loading or not available.';
  }

  const calsEaten = mealLogs.reduce((acc, log) => acc + (log.calories || 0), 0);
  const proteinEaten = mealLogs.reduce((acc, log) => acc + (log.protein_g || 0), 0);
  const calsRemaining = (profile.daily_calorie_target || 2000) - calsEaten;

  const logsText = mealLogs.length > 0 
    ? mealLogs.map(l => `- ${l.description || 'Photo Upload / Unknown Meal'} (${l.calories || 0} cals, ${l.protein_g || 0}g protein)`).join('\n')
    : 'No meals logged yet today.';

  const profileContext = `
---
USER PROFILE:
Age/Sex: ${profile.age || 'Unknown'} yo ${profile.sex || 'Unknown'}
Height/Weight: ${profile.height_cm || 'Unknown'}cm, ${profile.weight_kg || 'Unknown'}kg
Activity Level: ${profile.activity_level || 'sedentary'}
Daily Calorie Target: ${profile.daily_calorie_target || 2000}
Goals: ${(profile.goals || []).join(', ')}
Restrictions: ${(profile.dietary_restrictions || []).join(', ')}

TODAY'S LIVE STATUS:
Meals Logged Today:
${logsText}

Total Consumed: ${calsEaten} calories, ${proteinEaten}g protein
Remaining Calorie Budget: ${calsRemaining} calories
---
`;

  switch (mode) {
    case 'coach':
      return `You are Nouri, a highly adaptive, empathetic AI nutrition coach.
${profileContext}
Your task is to help the user hit their goals regardless of their current lifestyle or location. 
- If they are traveling or busy, suggest quick grab-and-go options. 
- If they are a student or at home, suggest meals based on ingredients they have or cheap/easy recipes. 
- If they are elderly, prioritize digestion and simple prep.

Always use "TODAY'S LIVE STATUS" to inform your advice. If they ask "What should I eat?", give recommendations that perfectly fit within their "Remaining Calorie Budget". Keep responses brief, actionable, and conversational.`;

    default:
      return `You are a helpful AI assistant.
${profileContext}`;
  }
}
