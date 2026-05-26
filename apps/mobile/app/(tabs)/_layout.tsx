import { Tabs } from 'expo-router'
import { CimeatTabBar } from '~/components/cimeat-tab-bar'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CimeatTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Beranda' }} />
      <Tabs.Screen name="diary" options={{ title: 'Diary' }} />
      <Tabs.Screen name="add" options={{ title: 'Catat' }} />
      <Tabs.Screen name="coach" options={{ title: 'Coach' }} />
      <Tabs.Screen name="settings" options={{ title: 'Setelan' }} />
    </Tabs>
  )
}
