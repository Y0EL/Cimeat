import { StyleSheet, View } from 'react-native'
import { Text } from './ui'
import { Spacing, Radius } from '@/constants/tokens'

interface StatusCardProps {
  consumed: number
  goal: number
}

function getStatus(pct: number): { message: string; bg: string; text: string } {
  if (pct === 0) return { message: 'Belum makan apa-apa nih', bg: '#F0EDE8', text: '#8A8886' }
  if (pct < 0.33) return { message: 'Awal yang baik!', bg: '#DCFCE7', text: '#16A34A' }
  if (pct < 0.66) return { message: 'Setengah jalan, lanjut!', bg: '#FEF3C7', text: '#D97706' }
  if (pct < 0.9) return { message: 'Hampir penuh', bg: '#FFF0EB', text: '#FF6B35' }
  if (pct <= 1) return { message: 'Hampir mencapai target', bg: '#FFF0EB', text: '#FF6B35' }
  return { message: 'Target terlampaui!', bg: '#FEE2E2', text: '#EF4444' }
}

export function StatusCard({ consumed, goal }: StatusCardProps) {
  const pct = goal > 0 ? consumed / goal : 0
  const status = getStatus(pct)

  return (
    <View style={[styles.card, { backgroundColor: status.bg }]}>
      <Text variant="subheadline" color={status.text} align="center">
        {status.message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
})
