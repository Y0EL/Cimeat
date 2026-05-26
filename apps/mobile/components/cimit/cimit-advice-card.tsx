import { useRouter } from 'expo-router'
import { ChevronRight, Flame } from 'lucide-react-native'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import type { CimitTone } from '@cimeat/types'
import { CimitMascot } from '~/components/cimit/cimit-mascot'
import { TtsButton } from '~/components/cimit/tts-button'

type Props = {
  message: string | undefined
  loading: boolean
  isRoast: boolean
  tone: CimitTone
}

export function CimitAdviceCard({ message, loading, isRoast, tone }: Props) {
  const router = useRouter()

  return (
    <Pressable
      onPress={() => router.push('/cimit')}
      className="mx-4 mt-4 overflow-hidden rounded-3xl bg-white p-4 active:opacity-90 dark:bg-zinc-900"
      style={{
        shadowColor: isRoast ? '#ef4444' : '#ea580c',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
        elevation: 5,
      }}
    >
      <View className="flex-row items-center gap-3">
        <CimitMascot size={52} tone={tone} />
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="font-display text-base font-bold text-zinc-900 dark:text-zinc-100">
              Cimit
            </Text>
            {isRoast ? (
              <View className="flex-row items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 dark:bg-red-950">
                <Flame size={11} color="#ef4444" />
                <Text className="font-sans text-[10px] font-bold text-red-500">roast mode</Text>
              </View>
            ) : null}
          </View>
          <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">
            {isRoast ? 'Ada yang mau gue komentarin nih' : 'Tips harian buat lo'}
          </Text>
        </View>
        <ChevronRight size={18} color="#a1a1aa" />
      </View>

      <View className="mt-3 rounded-2xl bg-primary-50 px-4 py-3 dark:bg-primary-950">
        {loading ? (
          <View className="flex-row items-center gap-2 py-1">
            <ActivityIndicator size="small" color="#ea580c" />
            <Text className="font-sans text-sm text-zinc-500 dark:text-zinc-400">
              Cimit lagi mikir...
            </Text>
          </View>
        ) : (
          <View className="flex-row items-start gap-2">
            <Text className="flex-1 font-sans text-sm leading-5 text-zinc-700 dark:text-zinc-200">
              {message ?? 'Catat makan lo dulu biar Cimit bisa kasih saran yang pas.'}
            </Text>
            {message ? <TtsButton text={message} tone={tone} /> : null}
          </View>
        )}
      </View>
    </Pressable>
  )
}
