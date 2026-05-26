import { Send, Sparkles } from 'lucide-react-native'
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScreenFade } from '~/components/screen-fade'
import { useCoachHistory } from '~/hooks/use-coach'
import { apiErrorMessage, apiStream } from '~/lib/api'
import { useAccentColor } from '~/lib/use-accent-color'

type Msg = { id: string; role: 'user' | 'model'; content: string }

const STREAM_ID = '__streaming__'

const SUGGESTIONS = [
  'Berapa kalori nasi goreng?',
  'Menu sehat buat turun berat badan?',
  'Sisa kalori gue hari ini gimana?',
  'Tips makan tinggi protein dong',
]

export default function CoachTab() {
  const accent = useAccentColor()
  const insets = useSafeAreaInsets()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const history = useCoachHistory()

  useEffect(() => {
    if (history.data) {
      setMessages(history.data.map((m) => ({ id: m.id, role: m.role, content: m.content })))
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

    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', content: msg }
    const modelMsg: Msg = { id: STREAM_ID, role: 'model', content: '' }
    setMessages((prev) => [...prev, userMsg, modelMsg])

    try {
      await apiStream('/v1/coach/chat', { message: msg }, (raw) => {
        let chunk = raw
        try {
          const data = JSON.parse(raw) as { chunk?: string; text?: string }
          chunk = data.chunk ?? data.text ?? ''
        } catch {
          // plain text chunk
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
      history.refetch()
    }
  }

  const empty = messages.length === 0

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
          style={{ paddingBottom: Math.max(insets.bottom, 12) + 76 }}
        >
          <View className="flex-row items-center gap-2 px-4 pb-2 pt-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950">
              <Sparkles size={18} color={accent} />
            </View>
            <View>
              <Text className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Coach Cimeat
              </Text>
              <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">
                AI Diet Coach
              </Text>
            </View>
          </View>

          <ScrollView
            ref={scrollRef}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 12, paddingTop: 4 }}
            keyboardShouldPersistTaps="handled"
          >
            {empty ? (
              <View className="items-center justify-center px-4 pt-16">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950">
                  <Sparkles size={28} color={accent} />
                </View>
                <Text className="mt-5 text-center font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Tanya apa aja soal makanan
                </Text>
                <Text className="mt-2 max-w-[280px] text-center font-sans text-sm leading-5 text-zinc-500 dark:text-zinc-400">
                  Tanya apa aja soal makanan & target kalori lo. Gue bantu hitung dan kasih saran.
                </Text>
                <View className="mt-6 w-full gap-2">
                  {SUGGESTIONS.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => send(s)}
                      className="rounded-2xl border border-primary-200 bg-white px-4 py-3 active:opacity-70 dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <Text className="font-sans text-sm text-zinc-700 dark:text-zinc-200">{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              messages.map((m, i) => (
                <View
                  key={m.id || String(i)}
                  className={`mb-2 max-w-[82%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}
                >
                  <View
                    className={`rounded-2xl px-4 py-3 ${
                      m.role === 'user'
                        ? 'rounded-br-md bg-primary-600'
                        : 'rounded-bl-md bg-white dark:bg-zinc-900'
                    }`}
                  >
                    <Text
                      className={`font-sans text-sm leading-5 ${
                        m.role === 'user' ? 'text-white' : 'text-zinc-800 dark:text-zinc-100'
                      }`}
                    >
                      {m.content || '...'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View className="flex-row items-end gap-2 border-t border-primary-100 px-4 py-3 dark:border-zinc-800">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ketik pesan..."
              placeholderTextColor="#a1a1aa"
              className="flex-1 rounded-2xl bg-white px-4 py-3 font-sans text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
              multiline
              maxLength={2000}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => send(input)}
            />
            <Pressable
              onPress={() => send(input)}
              disabled={!input.trim() || streaming}
              className="h-11 w-11 items-center justify-center rounded-full bg-primary-600 active:opacity-80 disabled:opacity-40"
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
