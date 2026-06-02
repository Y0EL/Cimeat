import { StyleSheet, View, Platform } from 'react-native'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useRouter } from 'expo-router'
import { Home, Plus, BarChart3, User, Zap } from 'lucide-react-native'
import { Pressable } from './ui'
import { Colors } from '@/constants/tokens'

const TABS = [
  { name: 'index', icon: Home },
  { name: 'log', icon: Zap },
  { name: 'center', icon: Plus },
  { name: 'progress', icon: BarChart3 },
  { name: 'profile', icon: User },
]

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter()
  const routeNames = state.routes.map((r) => r.name)

  return (
    <View style={styles.outer}>
      <View style={styles.pill}>
        {TABS.map((tab) => {
          if (tab.name === 'center') {
            return (
              <View key="center" style={styles.centerOuter}>
                <Pressable
                  onPress={() => router.push('/add-food')}
                  style={styles.centerButton}
                >
                  <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
                </Pressable>
              </View>
            )
          }

          const routeIndex = routeNames.indexOf(tab.name)
          if (routeIndex === -1) return null
          const isFocused = state.index === routeIndex
          const Icon = tab.icon

          return (
            <Pressable
              key={tab.name}
              onPress={() => navigation.navigate(tab.name)}
              style={styles.tab}
            >
              <Icon
                size={24}
                color={isFocused ? Colors.primary : '#C4C4C4'}
                strokeWidth={isFocused ? 2.2 : 1.5}
              />
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: 20,
    right: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 36,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(240,237,232,0.5)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
  },
  centerOuter: {
    width: 64,
    alignItems: 'center',
    marginTop: -28,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
})
