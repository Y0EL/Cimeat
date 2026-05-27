import { useRouter } from 'expo-router'
import { ChevronLeft, Send, Sparkles } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { TtsButton } from '~/components/cimit/tts-button'
import { ScreenFade } from '~/components/screen-fade'
import { useCimitHistory, useRefreshCimitHistory } from '~/hooks/use-cimit'
import { useProfile } from '~/hooks/use-summary'
import { apiErrorMessage, apiStream } from '~/lib/api'
import { track } from '~/lib/analytics'
import { useThemeColors } from '~/lib/theme'

type Msg = { id: string; role: 'user' | 'model'; content: string }

const STREAM_ID = '__streaming__'

const SUGGESTIONS = [
  'Sisa kalori gue hari ini gimana?',
  'Menu sehat buat turun BB dong',
  'Roast pola makan gue hari ini',
  'Tips makan tinggi protein',
]

function Dot({ delay, color }: { delay: number; color: string }) {
  const opacity = useSharedValue(0.3)
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, false),
    )
  }, [opacity, delay])
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }, style]} />
}

function TypingDots({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 4 }}>
      <Dot delay={0} color={color} />
      <Dot delay={150} color={color} />
      <Dot delay={300} color={color} />
    </View>
  )
}

export default function CimitChatScreen() {
  const c = useThemeColors()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const profile = useProfile()
  const tone = profile.data?.cimitTone ?? 'normal'
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const history = useCimitHistory()
  const refreshHistory = useRefreshCimitHistory()

  useEffect(() => {
    if (history.data) {
      setMessages(
        history.data.map((m) => ({
          id: m.id,
          role: m.role === 'model' ? 'model' : 'user',
          content: m.content,
        })),
      )
    }
  }, [history.data])

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60)
    return () => clearTimeout(timer)
  }, [messages])

  async function send(text: string) {
    const msg = text.trim()
    if (!msg || streaming) return
    setInput('')
    setStreaming(true)
    track('cimit_chat')

    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', content: msg }
    const modelMsg: Msg = { id: STREAM_ID, role: 'model', content: '' }
    setMessages((prev) => [...prev, userMsg, modelMsg])

    try {
      await apiStream('/v1/cimit/chat', { message: msg }, (raw) => {
        let chunk = raw
        try {
          const data = JSON.parse(raw) as { chunk?: string; text?: string }
          chunk = data.chunk ?? data.text ?? ''
        } catch {
          chunk = raw
        }
        if (!chunk) return
        setMessages((prev) =>
          prev.map((m) => (m.id === STREAM_ID ? { ...m, content: m.content + chunk } : m)),
        )
      })
    } catch (err) {
      Alert.alert('Gagal', apiErrorMessage(err))
      setMessages((prev) => prev.filter((m) => m.id !== STREAM_ID))
    } finally {
      setStreaming(false)
      setMessages((prev) =>
        prev.map((m) => (m.id === STREAM_ID ? { ...m, id: `m-${Date.now()}` } : m)),
      )
      refreshHistory()
    }
  }

  const empty = messages.length === 0

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScreenFade>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, paddingBottom: Math.max(insets.bottom, 8) }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8, paddingTop: 8 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: c.card }}
            >
              <ChevronLeft size={20} color={c.textSub} />
            </Pressable>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 18, color: c.text }}>
                  Cimit AI
                </Text>
                <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#22C55E' }} />
              </View>
              <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: c.textSub }}>
                mode {tone}
              </Text>
            </View>
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1, paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingBottom: 12, paddingTop: 4 }}
            keyboardShouldPersistTaps="handled"
          >
            {empty ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingTop: 40 }}>
                <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 8 }}>
                  <Sparkles size={40} color="#ffffff" />
                </View>
                <Text style={{ marginTop: 20, textAlign: 'center', fontFamily: 'Outfit_900Black', fontSize: 22, color: c.text }}>
                  Halo, gue Cimit!
                </Text>
                <Text style={{ marginTop: 8, maxWidth: 280, textAlign: 'center', fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 22, color: c.textSub }}>
                  Tanya apa aja soal makanan & target lo. Gue bantu hitung, saranin, dan kadang
                  roast dikit biar lo on-track.
                </Text>
                <View style={{ marginTop: 24, width: '100%', gap: 8 }}>
                  {SUGGESTIONS.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => send(s)}
                      style={({ pressed }) => ({
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: c.dark ? '#FF6B3550' : '#FF6B3530',
                        backgroundColor: pressed ? c.orangeSoft : c.card,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                      })}
                    >
                      <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 14, color: c.text }}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              messages.map((m, i) => (
                <Animated.View
                  key={m.id || String(i)}
                  entering={FadeInDown.duration(280)}
                  style={{ marginBottom: 8, maxWidth: '82%', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  <View
                    style={{
                      borderRadius: 20,
                      borderBottomRightRadius: m.role === 'user' ? 6 : 20,
                      borderBottomLeftRadius: m.role === 'model' ? 6 : 20,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: m.role === 'user' ? '#FF6B35' : c.card,
                      borderLeftWidth: m.role === 'model' ? 3 : 0,
                      borderLeftColor: '#FF6B35',
                    }}
                  >
                    {m.id === STREAM_ID && !m.content ? (
                      <TypingDots color="#FF6B35" />
                    ) : (
                      <Text
                        style={{
                          fontFamily: 'Outfit_400Regular',
                          fontSize: 14,
                          lineHeight: 22,
                          color: m.role === 'user' ? '#ffffff' : c.text,
                        }}
                      >
                        {m.content}
                      </Text>
                    )}
                  </View>
                  {m.role === 'model' && m.content && m.id !== STREAM_ID ? (
                    <View style={{ marginTop: 4, alignSelf: 'flex-start' }}>
                      <TtsButton text={m.content} tone={tone} size={15} />
                    </View>
                  ) : null}
                </Animated.View>
              ))
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderTopWidth: 1, borderTopColor: c.dark ? '#FF6B3530' : '#FF6B3520', paddingHorizontal: 16, paddingVertical: 12 }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ketik ke Cimit..."
              placeholderTextColor={c.textSub}
              style={{ flex: 1, borderRadius: 20, backgroundColor: c.card, paddingHorizontal: 16, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 14, color: c.text, maxHeight: 120 }}
              multiline
              maxLength={2000}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => send(input)}
            />
            <Pressable
              onPress={() => send(input)}
              disabled={!input.trim() || streaming}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: input.trim() && !streaming ? '#FF6B35' : '#FF6B3560',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.8 : 1,
              })}
              accessibilityLabel="Kirim"
            >
              <Send size={18} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ScreenFade>
    </SafeAreaView>
  )
}
