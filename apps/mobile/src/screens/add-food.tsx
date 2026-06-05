import { useState } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio'
import { Camera, Mic, Type, Search, Sparkles, X, StopCircle } from 'lucide-react-native'
import { Screen, Text, Pressable, Input, Button, Toast } from '@/components/ui'
import type { ToastType } from '@/components/ui'
import { useTheme } from '@/hooks/use-theme'
import { useAnalyzeImage, useAnalyzeText } from '@/hooks/use-food-ai'
import { transcribeAudio } from '@/lib/deepgram'
import { Spacing } from '@/constants/tokens'

export function AddFoodScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const analyzeImage = useAnalyzeImage()
  const analyzeText = useAnalyzeText()
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const [textInput, setTextInput] = useState('')
  const [mode, setMode] = useState<'pick' | 'text'>('pick')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [toast, setToast] = useState<{ title: string; message?: string; type: ToastType } | null>(null)

  function showError(title: string, message?: string) {
    setToast({ title, message, type: 'error' })
  }

  async function handleCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      showError('Izin diperlukan', 'Berikan akses kamera untuk memfoto makanan')
      return
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true })
    if (result.canceled || !result.assets[0]?.base64) return
    analyzeImage.mutate(
      { image: result.assets[0].base64, mimeType: 'image/jpeg' },
      {
        onSuccess(data) {
          router.replace({ pathname: '/analysis-result', params: { result: JSON.stringify(data) } })
        },
        onError(err: any) {
          showError('Scan gagal', err?.message ?? 'Tidak bisa menganalisis foto')
        },
      },
    )
  }

  function handleTextSubmit() {
    if (!textInput.trim()) return
    analyzeText.mutate(
      { text: textInput.trim() },
      {
        onSuccess(data) {
          setTextInput('')
          router.replace({ pathname: '/analysis-result', params: { result: JSON.stringify(data) } })
        },
        onError(err: any) {
          showError('Analisis gagal', err?.message ?? 'Tidak bisa menganalisis teks')
        },
      },
    )
  }

  async function handleVoice() {
    if (audioRecorder.isRecording) {
      try {
        await audioRecorder.stop()
        const uri = audioRecorder.uri
        if (!uri) return

        setIsTranscribing(true)
        try {
          const transcript = await transcribeAudio(uri)
          setIsTranscribing(false)
          analyzeText.mutate(
            { text: transcript },
            {
              onSuccess(data) {
                router.replace({ pathname: '/analysis-result', params: { result: JSON.stringify(data) } })
              },
              onError(err: any) {
                showError('Analisis gagal', err?.message ?? 'Tidak bisa menganalisis suara')
              },
            },
          )
        } catch (err: any) {
          setIsTranscribing(false)
          showError('Transkripsi gagal', err?.message)
        }
      } catch (err: any) {
        setIsTranscribing(false)
        showError('Error', err?.message ?? 'Gagal menghentikan rekaman')
      }
      return
    }

    const { granted } = await AudioModule.requestRecordingPermissionsAsync()
    if (!granted) {
      showError('Izin mikrofon', 'Berikan akses mikrofon untuk input suara')
      return
    }

    try {
      await audioRecorder.prepareToRecordAsync()
      audioRecorder.record()
    } catch (err: any) {
      showError('Rekam gagal', err?.message ?? 'Tidak bisa memulai rekaman')
    }
  }

  const isLoading = analyzeImage.isPending || analyzeText.isPending || isTranscribing

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loadingArea}>
          <View style={[styles.loadingCircle, { backgroundColor: colors.primaryMuted }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text variant="headline">
            {isTranscribing ? 'Mengenali suara...' : 'Menganalisis...'}
          </Text>
          <Text variant="subheadline" color={colors.textSecondary}>
            {isTranscribing ? 'Deepgram memproses audio' : 'AI sedang mendeteksi makananmu'}
          </Text>
        </View>
        <Toast
          visible={!!toast}
          title={toast?.title ?? ''}
          message={toast?.message}
          type={toast?.type ?? 'error'}
          onHide={() => setToast(null)}
        />
      </Screen>
    )
  }

  const isRecording = audioRecorder.isRecording

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title2">Tambah Makanan</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {mode === 'text' ? (
        <View style={styles.textArea}>
          <Text variant="subheadline" color={colors.textSecondary}>Ketik makanan yang kamu makan</Text>
          <Input
            placeholder="Contoh: nasi goreng 1 porsi, teh manis"
            value={textInput}
            onChangeText={setTextInput}
            autoFocus
            returnKeyType="send"
            onSubmitEditing={handleTextSubmit}
          />
          <View style={styles.textActions}>
            <Pressable onPress={() => setMode('pick')} style={[styles.cancelBtn, { borderColor: colors.border }]}>
              <Text variant="subheadline" color={colors.textSecondary}>Batal</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Button title="Analisis" onPress={handleTextSubmit} disabled={!textInput.trim()} />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.methods}>
          <Pressable onPress={handleCamera} style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Camera size={28} color="#FFFFFF" strokeWidth={1.8} />
            </View>
            <View>
              <View style={styles.heroTitleRow}>
                <Text variant="title3" color="#FFFFFF">Scan AI</Text>
                <Sparkles size={16} color="rgba(255,255,255,0.6)" />
              </View>
              <Text variant="footnote" color="rgba(255,255,255,0.7)">Foto makanan, AI deteksi otomatis</Text>
            </View>
          </Pressable>

          <View style={styles.secondaryRow}>
            <Pressable
              onPress={handleVoice}
              style={[styles.secCard, { backgroundColor: isRecording ? '#7C3AED' : colors.surface }]}
            >
              <View style={[styles.secIcon, { backgroundColor: isRecording ? 'rgba(255,255,255,0.2)' : '#EDE9FE' }]}>
                {isRecording ? (
                  <StopCircle size={22} color="#FFFFFF" strokeWidth={1.8} />
                ) : (
                  <Mic size={22} color="#7C3AED" strokeWidth={1.8} />
                )}
              </View>
              <Text variant="headline" color={isRecording ? '#FFFFFF' : undefined}>
                {isRecording ? 'Stop' : 'Suara'}
              </Text>
            </Pressable>
            <Pressable onPress={() => setMode('text')} style={[styles.secCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.secIcon, { backgroundColor: '#DBEAFE' }]}>
                <Type size={22} color="#2563EB" strokeWidth={1.8} />
              </View>
              <Text variant="headline">Ketik</Text>
            </Pressable>
            <Pressable style={[styles.secCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.secIcon, { backgroundColor: '#D1FAE5' }]}>
                <Search size={22} color="#059669" strokeWidth={1.8} />
              </View>
              <Text variant="headline">Cari</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Toast
        visible={!!toast}
        title={toast?.title ?? ''}
        message={toast?.message}
        type={toast?.type ?? 'error'}
        onHide={() => setToast(null)}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.lg, marginBottom: Spacing.xl },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  loadingArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  textArea: { gap: Spacing.lg, marginTop: Spacing.lg },
  textActions: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: { height: 52, paddingHorizontal: 20, borderRadius: 9999, borderWidth: 1.5, justifyContent: 'center' },
  methods: { gap: Spacing.md },
  heroCard: { backgroundColor: '#FF6B35', borderRadius: 24, padding: 24, gap: 16, shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 6 },
  heroIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secondaryRow: { flexDirection: 'row', gap: Spacing.md },
  secCard: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center', gap: 10 },
  secIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
})
