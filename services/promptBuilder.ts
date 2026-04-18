import mockProfile from '../constants/mockProfile.json';

export type PromptMode = 'coach';

export function getSystemPrompt(mode: PromptMode, mealLogs: any[] = []): string {
  const calsEaten = mealLogs.reduce((acc, log) => acc + (log.calories || 0), 0);
  const proteinEaten = mealLogs.reduce((acc, log) => acc + (log.protein_g || 0), 0);
  const calsRemaining = mockProfile.daily_calorie_target - calsEaten;

  const logsText = mealLogs.length > 0 
    ? mealLogs.map(l => `- ${l.description || 'Photo Upload / Unknown Meal'} (${l.calories || 0} cals, ${l.protein_g || 0}g protein)`).join('\n')
    : 'No meals logged yet today.';

  const profileContext = `
---
USER PROFILE:
Age/Sex: ${mockProfile.age} yo ${mockProfile.sex}
Height/Weight: ${mockProfile.height}cm, ${mockProfile.weight}kg
BMI: ${mockProfile.bmi}
Activity Level: ${mockProfile.activity_level}
Daily Calorie Target: ${mockProfile.daily_calorie_target}
Goals: ${mockProfile.goals.join(', ')}
Restrictions: ${mockProfile.dietary_restrictions.join(', ')}

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
