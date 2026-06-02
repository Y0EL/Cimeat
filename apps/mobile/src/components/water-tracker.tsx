import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Droplets } from 'lucide-react-native'
import { Text, Pressable } from './ui'
import { useTheme } from '@/hooks/use-theme'
import { Spacing } from '@/constants/tokens'
import * as Haptics from 'expo-haptics'

export function WaterTracker() {
  const { colors } = useTheme()
  const [glasses, setGlasses] = useState(0)
  const total = 8

  function toggle(index: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setGlasses(index + 1 === glasses ? index : index + 1)
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Droplets size={16} color="#3B82F6" strokeWidth={2} />
        <Text variant="subheadline">Air</Text>
        <Text variant="caption" color={colors.textTertiary}>
          {glasses}/{total}
        </Text>
      </View>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <Pressable key={i} onPress={() => toggle(i)} haptic={false}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: i < glasses ? '#3B82F6' : colors.border,
                },
              ]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
})
