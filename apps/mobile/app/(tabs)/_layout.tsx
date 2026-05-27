import { Tabs } from 'expo-router'
import { CimeatTabBar } from '~/components/cimeat-tab-bar'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CimeatTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Beranda' }} />
      <Tabs.Screen name="recipe" options={{ title: 'Resep' }} />
      <Tabs.Screen name="nearby" options={{ title: 'Sekitar' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progres' }} />
    </Tabs>
  )
}
