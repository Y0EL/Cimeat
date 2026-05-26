import { Infinity as InfinityIcon, Zap } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import type { UsageFeature } from '@cimeat/types'
import { useFeatureQuota } from '~/hooks/use-quota'
import { useSubscription } from '~/hooks/use-subscription'

export function QuotaBadge({ feature, label }: { feature: UsageFeature; label?: string }) {
  const quota = useFeatureQuota(feature)
  const { openPaywall } = useSubscription()
  if (!quota) return null

  if (quota.unlimited) {
    return (
      <View className="flex-row items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 dark:bg-primary-950">
        <InfinityIcon size={12} color="#ea580c" />
        <Text className="font-sans text-[11px] font-semibold text-primary-700 dark:text-primary-300">
          {label ? `${label} unlimited` : 'unlimited'}
        </Text>
      </View>
    )
  }

  const exhausted = quota.exhausted
  return (
    <Pressable
      onPress={exhausted ? () => void openPaywall() : undefined}
      className={
        exhausted
          ? 'flex-row items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 active:opacity-70 dark:bg-red-950'
          : 'flex-row items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800'
      }
    >
      <Zap size={12} color={exhausted ? '#ef4444' : '#71717a'} />
      <Text
        className={
          exhausted
            ? 'font-sans text-[11px] font-semibold text-red-500'
            : 'font-sans text-[11px] font-semibold text-zinc-600 dark:text-zinc-300'
        }
      >
        {exhausted ? 'Upgrade' : `${quota.remaining} tersisa`}
      </Text>
    </Pressable>
  )
}
