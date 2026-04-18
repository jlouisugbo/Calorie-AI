import { View } from 'react-native';

interface StepProgressProps {
  currentStep: number;
  totalSteps?: number;
}

export function StepProgress({ currentStep, totalSteps = 4 }: StepProgressProps) {
  return (
    <View className="flex-row items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;

        return (
          <View
            key={step}
            className={[
              'rounded-full',
              isActive ? 'w-6 h-2 bg-primary' : 'w-2 h-2',
              isCompleted ? 'bg-primary opacity-50' : !isActive ? 'bg-border' : '',
            ].join(' ')}
          />
        );
      })}
    </View>
  );
}
