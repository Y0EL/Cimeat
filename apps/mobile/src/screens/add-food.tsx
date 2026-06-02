import { useState } from 'react'
import { StyleSheet, View, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Camera, Mic, Type, Search, Sparkles, X } from 'lucide-react-native'
import { Screen, Text, Pressable, Input, Button } from '@/components/ui'
import { useTheme } from '@/hooks/use-theme'
import { useAnalyzeImage, useAnalyzeText } from '@/hooks/use-food-ai'
import { Spacing } from '@/constants/tokens'

export function AddFoodScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const analyzeImage = useAnalyzeImage()
  const analyzeText = useAnalyzeText()
  const [textInput, setTextInput] = useState('')
  const [mode, setMode] = useState<'pick' | 'text'>('pick')

  async function handleCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Izin diperlukan', 'Berikan akses kamera untuk memfoto makanan')
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
        onError() { Alert.alert('Gagal', 'Tidak bisa menganalisis foto') },
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
        onError() { Alert.alert('Gagal', 'Tidak bisa menganalisis teks') },
      },
    )
  }

  const isLoading = analyzeImage.isPending || analyzeText.isPending

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loadingArea}>
          <View style={[styles.loadingCircle, { backgroundColor: colors.primaryMuted }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text variant="headline">Menganalisis...</Text>
          <Text variant="subheadline" color={colors.textSecondary}>AI sedang mendeteksi makananmu</Text>
        </View>
      </Screen>
    )
  }

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
            <Pressable style={[styles.secCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.secIcon, { backgroundColor: '#EDE9FE' }]}>
                <Mic size={22} color="#7C3AED" strokeWidth={1.8} />
              </View>
              <Text variant="headline">Suara</Text>
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
