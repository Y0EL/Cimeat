import { Crown, Sparkles } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import type { Plan } from '~/lib/revenuecat'

type BadgeMeta = { label: string; bg: string; fg: string; iconColor: string }

const META: Record<Plan, BadgeMeta> = {
  free: { label: 'Free', bg: '#F0EEE9', fg: '#8A8886', iconColor: '#8A8886' },
  pro: { label: 'Pro', bg: '#FFF3EE', fg: '#FF6B35', iconColor: '#FF6B35' },
  max: { label: 'MAX', bg: '#FF6B35', fg: '#ffffff', iconColor: '#ffffff' },
}

export function PlanBadge({ plan, onPress }: { plan: Plan; onPress?: () => void }) {
  const meta = META[plan]
  const Icon = plan === 'max' ? Crown : Sparkles
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: meta.bg }}>
      <Icon size={12} color={meta.iconColor} />
      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, color: meta.fg }}>{meta.label}</Text>
    </View>
  )
  if (!onPress) return content
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })} accessibilityRole="button">
      {content}
    </Pressable>
  )
}
