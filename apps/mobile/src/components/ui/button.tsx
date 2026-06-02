import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native'
import { Text } from './text'
import { useTheme } from '@/hooks/use-theme'
import { Radius, Spacing } from '@/constants/tokens'
import * as Haptics from 'expo-haptics'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme()

  const variants: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
    primary: {
      bg: colors.primary,
      text: '#FFFFFF',
    },
    secondary: {
      bg: '#FFFFFF',
      text: colors.textPrimary,
      border: colors.textPrimary,
    },
    ghost: {
      bg: 'transparent',
      text: colors.textPrimary,
    },
    destructive: {
      bg: colors.destructive,
      text: '#FFFFFF',
    },
  }

  const v = variants[variant]
  const isDisabled = disabled || loading

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: v.bg,
          borderColor: v.border ?? 'transparent',
          borderWidth: v.border ? 1.5 : 0,
          opacity: isDisabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text variant="headline" color={v.text} align="center">
          {title}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
