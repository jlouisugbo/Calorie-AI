const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
const LOGMEAL_API_KEY = process.env.EXPO_PUBLIC_LOGMEAL_API_KEY;

if (!ANTHROPIC_API_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_ANTHROPIC_API_KEY — copy .env.example to .env and fill it in.'
  );
}

if (!LOGMEAL_API_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_LOGMEAL_API_KEY — copy .env.example to .env and fill it in.'
  );
}

export const ENV = {
  ANTHROPIC_API_KEY,
  LOGMEAL_API_KEY,
} as const;
