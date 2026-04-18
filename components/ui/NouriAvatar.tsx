import Svg, { Rect } from 'react-native-svg';

const PALETTE: Record<string, string> = {
  S: '#E0A24A',
  L: '#5DAA3F',
  T: '#D2412A',
  C: '#F4E1A0',
};

const PIXELS = [
  '................',
  '................',
  '..SSSSSSSSSSSS..',
  '.SLLLLLLLLLLLLS.',
  '.SLLTLLCLLLTLLS.',
  '.SLLLLLLLLLLLLS.',
  '.SLCLLLTLLLLLLS.',
  '.SLLLLLLLLLLCLS.',
  '.SLLLLLTLLLLLLS.',
  '.SSLLLLLLLLLLSS.',
  '..SSLLLLLLLLSS..',
  '...SSLLLLLLSS...',
  '....SSLLLLSS....',
  '.....SSLLSS.....',
  '......SSSS......',
  '................',
];

export interface NouriAvatarProps {
  size?: number;
}

export function NouriAvatar({ size = 40 }: NouriAvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      {PIXELS.flatMap((row, y) =>
        row.split('').map((ch, x) => {
          const fill = PALETTE[ch];
          if (!fill) return null;
          return (
            <Rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={fill}
            />
          );
        }),
      )}
    </Svg>
  );
}
