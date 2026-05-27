import { useRouter } from 'expo-router'
import { ChevronRight, Flame, Sparkles } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import type { CimitTone } from '@cimeat/types'
import { TtsButton } from '~/components/cimit/tts-button'
import { SkeletonLines } from '~/components/motion/skeleton'

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
      style={{
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 32,
        backgroundColor: '#2A2D30',
        overflow: 'hidden',
        shadowColor: isRoast ? '#ef4444' : '#FF6B35',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 24,
        elevation: 8,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: '#FF6B35',
          opacity: 0.15,
        }}
        pointerEvents="none"
      />
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#FF6B35',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={22} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#ffffff' }}>
                Cimit AI
              </Text>
              {isRoast ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Flame size={11} color="#ef4444" />
                  <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 10, color: '#ef4444' }}>roast mode</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#8A8886', marginTop: 2 }}>
              {isRoast ? 'Ada yang mau gue komentarin nih' : 'Tips harian buat lo'}
            </Text>
          </View>
          <ChevronRight size={18} color="#8A8886" />
        </View>

        <View style={{ marginTop: 12, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.07)' }}>
          {loading ? (
            <SkeletonLines tint="rgba(255,255,255,0.1)" />
          ) : (
            <Animated.View entering={FadeIn.duration(300)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Text style={{ flex: 1, fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 22, color: '#F8F7F4' }}>
                {message ?? 'Catat makan lo dulu biar Cimit bisa kasih saran yang pas.'}
              </Text>
              {message ? <TtsButton text={message} tone={tone} /> : null}
            </Animated.View>
          )}
        </View>
      </View>
    </Pressable>
  )
}
