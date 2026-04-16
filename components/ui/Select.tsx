import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Sheet } from '@/components/ui/Sheet';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  label,
  className = '',
}: SelectProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((o) => o.value === value);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
  };

  return (
    <View className={`gap-1 ${className}`}>
      {label && <Text className="text-sm font-medium text-text-base">{label}</Text>}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
        className="bg-surface border border-border rounded-lg px-4 py-3 flex-row items-center justify-between"
      >
        <Text className={`text-sm ${selectedOption ? 'text-text-base' : 'text-muted'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text className="text-muted text-xs">▾</Text>
      </TouchableOpacity>

      <Sheet visible={open} onClose={() => setOpen(false)} snapHeight={300}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleSelect(option.value)}
              activeOpacity={0.7}
              className="flex-row items-center justify-between py-3 border-b border-border"
            >
              <Text className="text-sm text-text-base">{option.label}</Text>
              {option.value === value && (
                <Text className="text-primary text-sm font-semibold">✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Sheet>
    </View>
  );
}
