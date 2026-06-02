export const Colors = {
  background: '#FFFFFF',
  surface: '#F8F7F4',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#1A1C1E',
  textSecondary: '#8A8886',
  textTertiary: '#BDBDBD',
  border: '#F0EDE8',
  primary: '#FF6B35',
  primaryLight: '#FF8C61',
  primaryMuted: '#FFF0EB',
  protein: '#22C55E',
  carbs: '#F59E0B',
  fat: '#EF4444',
  water: '#3B82F6',
  destructive: '#EF4444',
} as const

export type ColorTokens = typeof Colors

export const Typography = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '900' as const },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '900' as const },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '900' as const },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '700' as const },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '700' as const },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '500' as const },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '500' as const },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '500' as const },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
} as const

export type TypographyVariant = keyof typeof Typography

export const FontFamily = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  black: 'Outfit_800ExtraBold',
} as const

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  xxxxl: 64,
} as const

export const Radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const

export const HitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const
