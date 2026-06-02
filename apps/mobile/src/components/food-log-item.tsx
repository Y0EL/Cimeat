import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Text, Pressable } from './ui'
import { useTheme } from '@/hooks/use-theme'
import { Spacing } from '@/constants/tokens'

interface FoodLogItemProps {
  id: string
  foodName: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export function FoodLogItem({ id, foodName, calories, proteinG, carbsG, fatG }: FoodLogItemProps) {
  const { colors } = useTheme()
  const router = useRouter()

  return (
    <Pressable
      onPress={() => router.push(`/food-log/${id}`)}
      style={[styles.container, { borderBottomColor: colors.border }]}
    >
      <View style={styles.left}>
        <Text variant="body" numberOfLines={1}>
          {foodName}
        </Text>
        <Text variant="caption" color={colors.textTertiary}>
          P {Math.round(proteinG)}g · K {Math.round(carbsG)}g · L {Math.round(fatG)}g
        </Text>
      </View>
      <Text variant="callout" color={colors.textSecondary}>
        {calories} kkal
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flex: 1,
    marginRight: Spacing.md,
    gap: 2,
  },
})
