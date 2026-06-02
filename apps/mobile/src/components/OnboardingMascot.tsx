import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { CimeatMascot, type CimeatMascotVariant } from './CimeatMascot'
import { Radius, Spacing } from '@/constants/tokens'
import { useTheme } from '@/hooks/use-theme'

interface OnboardingMascotProps {
  variant?: CimeatMascotVariant
  width?: number
  height?: number
  style?: StyleProp<ViewStyle>
}

export function OnboardingMascot({
  variant = 'base',
  width = 220,
  height = 220,
  style,
}: OnboardingMascotProps) {
  const { colors } = useTheme()

  return (
    <View
      style={[
        styles.wadah,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <CimeatMascot variant={variant} width={width} height={height} />
    </View>
  )
}

const styles = StyleSheet.create({
  wadah: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    minHeight: 260,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
  },
})
