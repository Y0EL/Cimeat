import { StyleSheet, View, Alert } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { Trash2 } from 'lucide-react-native'
import { Screen, Text, Card, Button, Pressable } from '@/components/ui'
import { useTheme } from '@/hooks/use-theme'
import { useDeleteFoodLog } from '@/hooks/use-food-logs'
import { Spacing } from '@/constants/tokens'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function FoodLogDetailRoute() {
  const { colors } = useTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const deleteMutation = useDeleteFoodLog(todayStr())

  function handleDelete() {
    if (!id) return
    Alert.alert('Hapus', 'Yakin ingin menghapus catatan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress() {
          deleteMutation.mutate(id, {
            onSuccess: () => router.back(),
          })
        },
      },
    ])
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Detail',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable onPress={handleDelete}>
              <Trash2 size={20} color={colors.destructive} />
            </Pressable>
          ),
        }}
      />
      <Screen>
        <Text variant="body" color={colors.textSecondary} style={styles.placeholder}>
          Detail catatan makanan
        </Text>
      </Screen>
    </>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    paddingTop: Spacing.xxl,
    textAlign: 'center',
  },
})
