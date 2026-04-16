import { View, Text, Image, type ImageSourcePropType } from 'react-native';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: ImageSourcePropType;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; px: number }> = {
  sm: { container: 'w-8 h-8', text: 'text-xs', px: 32 },
  md: { container: 'w-10 h-10', text: 'text-sm', px: 40 },
  lg: { container: 'w-12 h-12', text: 'text-base', px: 48 },
  xl: { container: 'w-16 h-16', text: 'text-xl', px: 64 },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const s = sizeStyles[size];

  if (src) {
    return (
      <Image
        source={src}
        className={`rounded-full ${s.container} ${className}`}
        width={s.px}
        height={s.px}
      />
    );
  }

  return (
    <View
      className={`rounded-full bg-indigo-100 items-center justify-center ${s.container} ${className}`}
    >
      <Text className={`font-semibold text-indigo-700 ${s.text}`}>
        {name ? getInitials(name) : '?'}
      </Text>
    </View>
  );
}
