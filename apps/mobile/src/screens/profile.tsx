import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronRight, LogOut } from 'lucide-react-native'
import { Screen, Text, Card, Button, Pressable } from '@/components/ui'
import { useTheme } from '@/hooks/use-theme'
import { useAuthStore } from '@/stores/auth-store'
import { useUpdateProfile } from '@/hooks/use-profile'
import { Spacing, Radius } from '@/constants/tokens'
import type { CimitTone } from '@cimeat/types'

const TONES: { key: CimitTone; label: string }[] = [
  { key: 'soft', label: 'Lembut' },
  { key: 'normal', label: 'Normal' },
  { key: 'savage', label: 'Savage' },
]

export function ProfileScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const profile = useAuthStore((s) => s.profile)
  const goal = useAuthStore((s) => s.goal)
  const signOut = useAuthStore((s) => s.signOut)
  const updateProfile = useUpdateProfile()

  function handleToneChange(tone: CimitTone) {
    updateProfile.mutate({ cimitTone: tone })
  }

  async function handleSignOut() {
    await signOut()
  }

  const initials = (profile?.name ?? profile?.email ?? '?').charAt(0).toUpperCase()

  return (
    <Screen scroll>
      <Text variant="title1" style={styles.title}>
        Profil
      </Text>

      <Card style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryMuted }]}>
            <Text variant="title2" color={colors.primary}>
              {initials}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text variant="headline">{profile?.name ?? 'Pengguna'}</Text>
            <Text variant="subheadline" color={colors.textSecondary}>
              {profile?.email ?? ''}
            </Text>
            <View style={[styles.planBadge, { backgroundColor: colors.primaryMuted }]}>
              <Text variant="caption" color={colors.primary}>
                {(profile?.activePlan ?? 'free').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <Pressable onPress={() => router.push('/goals')}>
        <Card style={styles.goalCard}>
          <View style={styles.goalRow}>
            <View>
              <Text variant="headline">Target Harian</Text>
              <Text variant="body" color={colors.textSecondary} style={styles.goalValue}>
                {goal?.calorieGoal ?? '-'} kkal
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textTertiary} />
          </View>
        </Card>
      </Pressable>

      <Card style={styles.toneCard}>
        <Text variant="headline">Gaya Cimit</Text>
        <Text variant="caption" color={colors.textSecondary} style={styles.toneSubtitle}>
          Sesuaikan nada AI coach
        </Text>
        <View style={styles.toneRow}>
          {TONES.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => handleToneChange(t.key)}
              style={[
                styles.tonePill,
                {
                  backgroundColor:
                    profile?.cimitTone === t.key ? colors.primary : 'transparent',
                  borderColor:
                    profile?.cimitTone === t.key ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                variant="subheadline"
                color={profile?.cimitTone === t.key ? '#FFFFFF' : colors.textPrimary}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <View style={styles.signOutSection}>
        <Pressable onPress={handleSignOut} style={[styles.signOutButton, { borderColor: colors.destructive }]}>
          <LogOut size={18} color={colors.destructive} />
          <Text variant="headline" color={colors.destructive}>
            Keluar
          </Text>
        </Pressable>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  profileCard: {
    marginBottom: Spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginTop: Spacing.xs,
  },
  goalCard: {
    marginBottom: Spacing.md,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalValue: {
    marginTop: 2,
  },
  toneCard: {
    marginBottom: Spacing.md,
  },
  toneSubtitle: {
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  toneRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tonePill: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  signOutSection: {
    marginTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
})
