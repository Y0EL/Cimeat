import { Infinity as InfinityIcon, Zap } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import type { UsageFeature } from '@cimeat/types'
import { useFeatureQuota } from '~/hooks/use-quota'
import { useSubscription } from '~/hooks/use-subscription'
import { useThemeColors } from '~/lib/theme'

export function QuotaBadge({ feature, label }: { feature: UsageFeature; label?: string }) {
  const c = useThemeColors()
  const quota = useFeatureQuota(feature)
  const { openPaywall } = useSubscription()
  if (!quota) return null

  if (quota.unlimited) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: c.orangeSoft }}>
        <InfinityIcon size={12} color={c.orange} />
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, color: c.orange }}>
          {label ? `${label} unlimited` : 'unlimited'}
        </Text>
      </View>
    )
  }

  const exhausted = quota.exhausted
  return (
    <Pressable
      onPress={exhausted ? () => void openPaywall() : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 99,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: exhausted ? 'rgba(239,68,68,0.12)' : c.cardAlt,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Zap size={12} color={exhausted ? '#ef4444' : c.textSub} />
      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, color: exhausted ? '#ef4444' : c.textSub }}>
        {exhausted ? 'Upgrade' : `${quota.remaining} tersisa`}
      </Text>
    </Pressable>
  )
}
