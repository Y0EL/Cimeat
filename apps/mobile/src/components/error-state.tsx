import { StyleSheet, View } from 'react-native'
import { AlertCircle } from 'lucide-react-native'
import { Text, Button } from './ui'
import { useTheme } from '@/hooks/use-theme'
import { Spacing } from '@/constants/tokens'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Terjadi kesalahan', onRetry }: ErrorStateProps) {
  const { colors } = useTheme()

  return (
    <View style={styles.container}>
      <AlertCircle size={40} color={colors.textTertiary} strokeWidth={1.2} />
      <Text variant="callout" color={colors.textSecondary} align="center" style={styles.message}>
        {message}
      </Text>
      {onRetry && <Button title="Coba lagi" onPress={onRetry} variant="secondary" />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  message: {
    marginTop: Spacing.sm,
  },
})
