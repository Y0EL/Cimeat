import { useState } from 'react'
import { StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native'
import { Text } from './text'
import { useTheme } from '@/hooks/use-theme'
import { FontFamily, Radius, Spacing, Typography } from '@/constants/tokens'

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string
  error?: string
  containerStyle?: ViewStyle
}

export function Input({ label, error, containerStyle, ...props }: InputProps) {
  const { colors } = useTheme()
  const [focused, setFocused] = useState(false)

  return (
    <View style={containerStyle}>
      {label && (
        <Text variant="footnote" color={colors.textSecondary} style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            borderColor: error ? colors.destructive : focused ? colors.primary : 'transparent',
            borderWidth: focused || error ? 1.5 : 0,
          },
        ]}
        placeholderTextColor={colors.textTertiary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && (
        <Text variant="caption" color={colors.destructive} style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.lg,
  },
  input: {
    height: 52,
    borderRadius: Radius.full,
    paddingHorizontal: 20,
    fontSize: Typography.body.fontSize,
    fontFamily: FontFamily.medium,
  },
  error: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.lg,
  },
})
