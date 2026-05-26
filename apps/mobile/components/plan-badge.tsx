import { Crown, Sparkles } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import type { Plan } from '~/lib/revenuecat'

const META: Record<Plan, { label: string; bg: string; fg: string }> = {
  free: { label: 'Free', bg: 'bg-zinc-100 dark:bg-zinc-800', fg: 'text-zinc-600 dark:text-zinc-300' },
  pro: { label: 'Pro', bg: 'bg-primary-100 dark:bg-primary-950', fg: 'text-primary-700 dark:text-primary-300' },
  max: { label: 'MAX', bg: 'bg-primary-600', fg: 'text-white' },
}

export function PlanBadge({ plan, onPress }: { plan: Plan; onPress?: () => void }) {
  const meta = META[plan]
  const Icon = plan === 'max' ? Crown : Sparkles
  const content = (
    <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${meta.bg}`}>
      <Icon size={12} color={plan === 'max' ? '#ffffff' : '#ea580c'} />
      <Text className={`font-sans text-[11px] font-bold ${meta.fg}`}>{meta.label}</Text>
    </View>
  )
  if (!onPress) return content
  return (
    <Pressable onPress={onPress} className="active:opacity-70" accessibilityRole="button">
      {content}
    </Pressable>
  )
}
