import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import {
  ChefHat,
  House,
  MapPin,
  Plus,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native'
import { useEffect } from 'react'
import { Pressable, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeColors } from '~/lib/theme'

type TabKey = 'index' | 'recipe' | 'log' | 'nearby' | 'progress'

const tabs: Record<TabKey, { icon: LucideIcon; label: string }> = {
  index: { icon: House, label: 'Beranda' },
  recipe: { icon: ChefHat, label: 'Resep' },
  log: { icon: Plus, label: 'Catat' },
  nearby: { icon: MapPin, label: 'Sekitar' },
  progress: { icon: TrendingUp, label: 'Progres' },
}

const barShadow = {
  shadowColor: '#1A1C1E',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 32,
  elevation: 16,
}

const fabShadow = {
  shadowColor: '#FF6B35',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.5,
  shadowRadius: 16,
  elevation: 10,
}

function FabButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Catat makanan"
      onPressIn={() => { scale.value = withSpring(0.88, { damping: 12 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 10 }) }}
      onPress={onPress}
      style={{ marginHorizontal: 4, marginTop: -18 }}
    >
      <Animated.View
        style={[
          {
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: '#FF6B35',
            alignItems: 'center',
            justifyContent: 'center',
          },
          fabShadow,
          animStyle,
        ]}
      >
        <Plus size={26} color="#ffffff" strokeWidth={2.6} />
      </Animated.View>
    </Pressable>
  )
}

function TabButton({
  icon: Icon,
  label,
  isFocused,
  onPress,
}: {
  icon: LucideIcon
  label: string
  isFocused: boolean
  onPress: () => void
}) {
  const c = useThemeColors()
  const dotOpacity = useSharedValue(isFocused ? 1 : 0)
  const iconScale = useSharedValue(isFocused ? 1 : 0.9)

  useEffect(() => {
    dotOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 180 })
    iconScale.value = withSpring(isFocused ? 1 : 0.9, { damping: 14 })
  }, [isFocused, dotOpacity, iconScale])

  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }))
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }))

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        <Animated.View style={iconStyle}>
          <Icon
            size={isFocused ? 24 : 22}
            color={isFocused ? '#FF6B35' : c.textSub}
            strokeWidth={isFocused ? 2.5 : 1.8}
          />
        </Animated.View>
        <Animated.View
          style={[
            { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FF6B35' },
            dotStyle,
          ]}
        />
      </View>
    </Pressable>
  )
}

export function CimeatTabBar({ state, navigation }: BottomTabBarProps) {
  const c = useThemeColors()
  const insets = useSafeAreaInsets()
  const slideY = useSharedValue(80)
  const opacity = useSharedValue(0)

  useEffect(() => {
    slideY.value = withSpring(0, { damping: 18, stiffness: 180 })
    opacity.value = withTiming(1, { duration: 300 })
  }, [slideY, opacity])

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
    opacity: opacity.value,
  }))

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingBottom: Math.max(insets.bottom, 16),
        paddingHorizontal: 20,
      }}
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            height: 68,
            borderRadius: 34,
            backgroundColor: c.dark ? 'rgba(26,28,31,0.96)' : 'rgba(255,255,255,0.92)',
            paddingHorizontal: 6,
          },
          {
            shadowColor: c.shadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: c.dark ? 0.4 : 0.12,
            shadowRadius: 32,
            elevation: 16,
          },
          containerStyle,
        ]}
      >
        {state.routes.map((route, index) => {
          const key = route.name as TabKey
          const config = tabs[key]
          if (!config) return null
          const isFocused = state.index === index

          const navigate = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name)
          }

          if (key === 'log') {
            return <FabButton key={route.key} onPress={navigate} />
          }

          return (
            <TabButton
              key={route.key}
              icon={config.icon}
              label={config.label}
              isFocused={isFocused}
              onPress={navigate}
            />
          )
        })}
      </Animated.View>
    </View>
  )
}
