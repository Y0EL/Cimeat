import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native'
import { Typography, FontFamily } from '@/constants/tokens'
import type { TypographyVariant } from '@/constants/tokens'
import { useTheme } from '@/hooks/use-theme'

interface TextProps extends RNTextProps {
  variant?: TypographyVariant
  color?: string
  align?: TextStyle['textAlign']
}

const weightToFamily: Record<string, string> = {
  '400': FontFamily.regular,
  '500': FontFamily.medium,
  '600': FontFamily.semibold,
  '700': FontFamily.bold,
  '800': FontFamily.black,
  '900': FontFamily.black,
}

export function Text({ variant = 'body', color, align, style, ...props }: TextProps) {
  const { colors } = useTheme()
  const typo = Typography[variant]

  return (
    <RNText
      style={[
        {
          fontSize: typo.fontSize,
          lineHeight: typo.lineHeight,
          fontFamily: weightToFamily[typo.fontWeight] ?? FontFamily.regular,
          color: color ?? colors.textPrimary,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    />
  )
}
