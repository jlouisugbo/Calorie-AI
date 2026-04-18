import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
} from 'react-native';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  default: { container: 'bg-primary', text: 'text-white' },
  outline: { container: 'bg-transparent border border-primary', text: 'text-primary' },
  ghost: { container: 'bg-transparent', text: 'text-primary' },
  destructive: { container: 'bg-destructive', text: 'text-white' },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: 'px-3 py-2', text: 'text-sm' },
  md: { container: 'px-4 py-3', text: 'text-sm' },
  lg: { container: 'px-6 py-4', text: 'text-base' },
};

export function Button({
  variant = 'default',
  size = 'md',
  loading = false,
  children,
  disabled,
  className = '',
  textClassName = '',
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      disabled={isDisabled}
      className={`flex-row items-center justify-center rounded-lg ${v.container} ${s.container} ${isDisabled ? 'opacity-50' : ''} ${className}`}
      activeOpacity={0.75}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color="currentColor" className="mr-2" />}
      <Text className={`font-semibold ${v.text} ${s.text} ${textClassName}`}>{children}</Text>
    </TouchableOpacity>
  );
}
