import { useState } from 'react'
import { StyleSheet, View, Alert, Platform, Image } from 'react-native'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { Screen, Text, Button } from '@/components/ui'
import { useTheme } from '@/hooks/use-theme'
import { auth, isFirebaseConfigured } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth-store'
import { Spacing, Radius } from '@/constants/tokens'

export default function LoginScreen() {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const signInAsGuest = useAuthStore((s) => s.signInAsGuest)

  async function handleGoogleSignIn() {
    if (!isFirebaseConfigured) return
    setLoading(true)
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider()
        await signInWithPopup(auth, provider)
      }
    } catch {
      setLoading(false)
    }
  }

  async function handleGuestSignIn() {
    setGuestLoading(true)
    try {
      await signInAsGuest()
    } catch {
      setGuestLoading(false)
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
