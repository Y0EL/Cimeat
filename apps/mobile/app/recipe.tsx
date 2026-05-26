import { useRouter } from 'expo-router'
import { ChevronLeft, Send, UtensilsCrossed } from 'lucide-react-native'
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
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenFade } from '~/components/screen-fade'
import { apiErrorMessage, apiStream } from '~/lib/api'
import { useAccentColor } from '~/lib/use-accent-color'

type Msg = { id: string; role: 'user' | 'model'; content: string }

const STREAM_ID = '__streaming__'

const SUGGESTIONS = [
  'Hitung kalori resep nasi goreng buat 4 porsi',
  'Bikin smoothie protein, hitung kalorinya',
  'Berapa kalori sup ayam homemade?',
]

export default function RecipeScreen() {
  const router = useRouter()
  const accent = useAccentColor()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60)
    return () => clearTimeout(timer)
  }, [messages])

  async function send(text: string) {
    const msg = text.trim()
    if (!msg || streaming) return
    setInput('')
    setStreaming(true)
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: msg },
      { id: STREAM_ID, role: 'model', content: '' },
    ])
    try {
      await apiStream('/v1/recipe/chat', { message: msg }, (raw) => {
        let chunk = raw
        try {
          const data = JSON.parse(raw) as { chunk?: string; text?: string }
          chunk = data.chunk ?? data.text ?? ''
        } catch {
          // plain text
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
    }
  }

  const empty = messages.length === 0

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <View className="flex-row items-center gap-2 px-4 pt-2">
            <Pressable
              onPress={() => router.back()}
              className="h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-zinc-900"
            >
              <ChevronLeft size={20} color="#71717a" />
            </Pressable>
            <Text className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Kalkulator resep
            </Text>
          </View>

          <ScrollView
            ref={scrollRef}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 12, paddingTop: 12 }}
            keyboardShouldPersistTaps="handled"
          >
            {empty ? (
              <View className="items-center pt-12">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950">
                  <UtensilsCrossed size={28} color={accent} />
                </View>
                <Text className="mt-5 text-center font-display text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Hitung kalori resep
                </Text>
                <Text className="mt-2 max-w-[280px] text-center font-sans text-sm leading-5 text-zinc-500 dark:text-zinc-400">
                  Ceritain resep lo, Cimeat hitung kalori per porsinya.
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
              placeholder="Ketik resep atau bahan..."
              placeholderTextColor="#a1a1aa"
              className="flex-1 rounded-2xl bg-white px-4 py-3 font-sans text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
              multiline
              maxLength={2000}
              onSubmitEditing={() => send(input)}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={() => send(input)}
              disabled={!input.trim() || streaming}
              className="h-11 w-11 items-center justify-center rounded-full bg-primary-600 active:opacity-80 disabled:opacity-40"
            >
              <Send size={18} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ScreenFade>
    </SafeAreaView>
  )
}
