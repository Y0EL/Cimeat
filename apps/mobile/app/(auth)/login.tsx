import { useState } from 'react'
import { StyleSheet, View, Image } from 'react-native'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import Constants from 'expo-constants'
import { Screen, Text, Button, Toast } from '@/components/ui'
import { useTheme } from '@/hooks/use-theme'
import { auth, isFirebaseConfigured } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth-store'
import { Spacing } from '@/constants/tokens'

GoogleSignin.configure({
  webClientId: Constants.expoConfig?.extra?.googleWebClientId ?? '',
})

export default function LoginScreen() {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const signInAsGuest = useAuthStore((s) => s.signInAsGuest)

  const [toast, setToast] = useState<{ title: string; message?: string } | null>(null)

  function showError(title: string, message?: string) {
    setToast({ title, message })
  }

  async function handleGoogleSignIn() {
    if (!isFirebaseConfigured) {
      showError('Firebase Error', 'Konfigurasi belum lengkap.')
      return
    }
    setLoading(true)
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      await GoogleSignin.signIn()
      const { idToken } = await GoogleSignin.getTokens()
      const credential = GoogleAuthProvider.credential(idToken)
      await signInWithCredential(auth, credential)
    } catch (e: any) {
      setLoading(false)
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return
      if (e.code === statusCodes.IN_PROGRESS) return
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showError('Google Play', 'Play Services tidak tersedia di perangkat ini.')
        return
      }
      showError('Login Gagal', e?.message ?? 'Terjadi kesalahan.')
    }
  }

  async function handleGuestSignIn() {
    if (!isFirebaseConfigured) {
      showError('Firebase Error', 'Konfigurasi belum lengkap.')
      return
    }
    setGuestLoading(true)
    try {
      await signInAsGuest()
    } catch (e: any) {
      setGuestLoading(false)
      if (e?.code === 'auth/operation-not-allowed') {
        showError('Belum Aktif', 'Aktifkan Anonymous Sign-in di Firebase Console.')
      } else {
        showError('Login Gagal', e?.message ?? 'Terjadi kesalahan.')
      }
    }
  }

  return (
    <Screen padded={false}>
      <View style={styles.container}>
        <View style={styles.heroArea}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.content}>
          <View style={styles.textBlock}>
            <Text variant="largeTitle" align="center">
              Cimeat
            </Text>
            <Text variant="body" color={colors.textSecondary} align="center" style={styles.tagline}>
              Pantau kalori harian.{'\n'}Capai tujuanmu.
            </Text>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text variant="title2" color={colors.primary}>AI</Text>
              <Text variant="caption" color={colors.textSecondary}>Food Scanner</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text variant="title2" color={colors.primary}>35+</Text>
              <Text variant="caption" color={colors.textSecondary}>Makanan Lokal</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text variant="title2" color={colors.primary}>Gratis</Text>
              <Text variant="caption" color={colors.textSecondary}>Mulai Sekarang</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Mulai Sekarang"
              onPress={handleGuestSignIn}
              loading={guestLoading}
              variant="primary"
            />
            <Button
              title="Masuk dengan Google"
              onPress={handleGoogleSignIn}
              loading={loading}
              variant="secondary"
            />
          </View>
        </View>
      </View>

      <Toast
        visible={!!toast}
        title={toast?.title ?? ''}
        message={toast?.message}
        type="error"
        onHide={() => setToast(null)}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 32,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 48,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  tagline: {
    marginTop: Spacing.sm,
    lineHeight: 24,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  actions: {
    gap: Spacing.md,
  },
})
