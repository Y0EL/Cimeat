import { StyleSheet, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { Text } from './ui'
import { useTheme } from '@/hooks/use-theme'
import { Spacing } from '@/constants/tokens'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  subtitle?: string
}

export function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  const { colors } = useTheme()

  return (
    <View style={styles.container}>
      <Icon size={48} color={colors.textTertiary} strokeWidth={1.2} />
      <Text variant="headline" color={colors.textSecondary} align="center" style={styles.title}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="subheadline" color={colors.textTertiary} align="center">
          {subtitle}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  title: {
    marginTop: Spacing.sm,
  },
})
