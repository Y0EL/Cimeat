import { StyleSheet, View } from 'react-native'
import { Text } from './ui'
import { useTheme } from '@/hooks/use-theme'
import { Spacing } from '@/constants/tokens'

interface MacroBarProps {
  label: string
  current: number
  goal: number
  color: string
}

export function MacroBar({ label, current, goal, color }: MacroBarProps) {
  const { colors } = useTheme()
  const progress = goal > 0 ? Math.min(current / goal, 1) : 0

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text variant="subheadline">{label}</Text>
        </View>
        <Text variant="subheadline" color={colors.textSecondary}>
          {Math.round(current)}/{Math.round(goal)}g
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${progress * 100}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
})
