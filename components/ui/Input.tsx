import { useState } from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  hint,
  className = '',
  containerClassName = '',
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className={`gap-1 ${containerClassName}`}>
      {label && <Text className="text-sm font-medium text-text-base">{label}</Text>}
      <TextInput
        className={`bg-surface border rounded-lg px-4 py-3 text-sm text-text-base ${
          error ? 'border-destructive' : focused ? 'border-primary' : 'border-border'
        } ${className}`}
        placeholderTextColor="#9ca3af"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <Text className="text-xs text-destructive">{error}</Text>}
      {hint && !error && <Text className="text-xs text-muted">{hint}</Text>}
    </View>
  );
}
