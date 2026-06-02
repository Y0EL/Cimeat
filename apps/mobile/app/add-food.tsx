import { Stack } from 'expo-router'
import { AddFoodScreen } from '@/screens/add-food'

export default function AddFoodRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'formSheet',
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          sheetExpandsWhenScrolledToEdge: false,
          sheetInitialDetentIndex: 0,
          sheetAllowedDetents: [0.55, 0.85],
        }}
      />
      <AddFoodScreen />
    </>
  )
}
