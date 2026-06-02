import { useState } from 'react'
import { StyleSheet, View, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { Screen, Text, Button, Input, Pressable } from '@/components/ui'
import { useTheme } from '@/hooks/use-theme'
import { useUpdateProfile } from '@/hooks/use-profile'
import { useAuthStore } from '@/stores/auth-store'
import { Spacing, Radius } from '@/constants/tokens'
import type { GoalType, ActivityLevel } from '@cimeat/types'

const TOTAL_STEPS = 6

interface OptionItem {
  key: string
  label: string
  sub?: string
}

const GOAL_OPTIONS: OptionItem[] = [
  { key: 'lose', label: 'Turunkan berat badan' },
  { key: 'maintain', label: 'Jaga berat badan' },
  { key: 'gain', label: 'Naikkan berat badan' },
]

const ACTIVITY_OPTIONS: OptionItem[] = [
  { key: 'sedentary', label: 'Tidak aktif', sub: 'Jarang olahraga' },
  { key: 'light', label: 'Sedikit aktif', sub: '1-2x seminggu' },
  { key: 'moderate', label: 'Cukup aktif', sub: '3-4x seminggu' },
  { key: 'active', label: 'Aktif', sub: '5-6x seminggu' },
  { key: 'very_active', label: 'Sangat aktif', sub: 'Setiap hari' },
]

export function OnboardingScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const updateProfile = useUpdateProfile()
  const setProfile = useAuthStore((s) => s.setProfile)

  const [step, setStep] = useState(0)
  const [goalType, setGoalType] = useState<GoalType | null>(null)
  const [sex, setSex] = useState<'male' | 'female' | null>(null)
  const [name, setName] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [activity, setActivity] = useState<ActivityLevel | null>(null)
  const [saving, setSaving] = useState(false)

  function canNext(): boolean {
    switch (step) {
      case 0: return goalType !== null
      case 1: return sex !== null
      case 2: return name.trim().length > 0
      case 3: return birthYear.length === 4 && height.length > 0 && weight.length > 0
      case 4: return activity !== null
      case 5: return true
      default: return false
    }
  }

  function handleNext() {
    if (!canNext()) return
    Haptics.selectionAsync()
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1)
    } else {
      handleFinish()
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1)
  }

  async function handleFinish() {
    setSaving(true)
    try {
      await useAuthStore.getState().createSession()
      const profileData = await updateProfile.mutateAsync({
        name: name.trim() || undefined,
        sex: sex ?? undefined,
        birthYear: parseInt(birthYear, 10),
        heightCm: parseFloat(height),
        weightKg: parseFloat(weight),
        activityLevel: activity ?? undefined,
        goalType: goalType ?? undefined,
      })
      setProfile(profileData)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(tabs)')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menyimpan'
      Alert.alert('Gagal', msg)
    } finally {
      setSaving(false)
    }
  }

  const progressWidth = ((step + 1) / TOTAL_STEPS) * 100

  return (
    <Screen padded={false}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          {step > 0 ? (
            <Pressable onPress={handleBack} style={styles.backBtn}>
              <ChevronLeft size={28} color={colors.textPrimary} />
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressWidth}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>

        <View style={styles.content}>
          {step === 0 && (
            <StepLayout title="Apa tujuanmu?">
              {GOAL_OPTIONS.map((o) => (
                <OptionPill
                  key={o.key}
                  label={o.label}
                  selected={goalType === o.key}
                  onPress={() => { setGoalType(o.key as GoalType); Haptics.selectionAsync() }}
                  colors={colors}
                />
              ))}
            </StepLayout>
          )}

          {step === 1 && (
            <StepLayout title="Jenis kelaminmu?" subtitle="Digunakan untuk menghitung kebutuhan kalori harian">
              <View style={styles.sexRow}>
                <Pressable
                  onPress={() => { setSex('female'); Haptics.selectionAsync() }}
                  style={[
                    styles.sexCard,
                    {
                      backgroundColor: sex === 'female' ? colors.primaryMuted : colors.surface,
                      borderColor: sex === 'female' ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text variant="title2" color={sex === 'female' ? colors.primary : colors.textPrimary}>
                    Wanita
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => { setSex('male'); Haptics.selectionAsync() }}
                  style={[
                    styles.sexCard,
                    {
                      backgroundColor: sex === 'male' ? colors.primaryMuted : colors.surface,
                      borderColor: sex === 'male' ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text variant="title2" color={sex === 'male' ? colors.primary : colors.textPrimary}>
                    Pria
                  </Text>
                </Pressable>
              </View>
            </StepLayout>
          )}

          {step === 2 && (
            <StepLayout title="Siapa namamu?">
              <Input
                placeholder="Ketik namamu"
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={handleNext}
              />
            </StepLayout>
          )}

          {step === 3 && (
            <StepLayout title="Data tubuhmu" subtitle="Untuk menghitung kebutuhan kalori harian">
              <Input
                label="Tahun lahir"
                placeholder="1995"
                keyboardType="number-pad"
                value={birthYear}
                onChangeText={setBirthYear}
                maxLength={4}
              />
              <Input
                label="Tinggi badan (cm)"
                placeholder="170"
                keyboardType="decimal-pad"
                value={height}
                onChangeText={setHeight}
              />
              <Input
                label="Berat badan (kg)"
                placeholder="70"
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
              />
            </StepLayout>
          )}

          {step === 4 && (
            <StepLayout title="Seberapa aktif kamu?">
              {ACTIVITY_OPTIONS.map((o) => (
                <OptionPill
                  key={o.key}
                  label={o.label}
                  sub={o.sub}
                  selected={activity === o.key}
                  onPress={() => { setActivity(o.key as ActivityLevel); Haptics.selectionAsync() }}
                  colors={colors}
                />
              ))}
            </StepLayout>
          )}

          {step === 5 && (
            <StepLayout title="Semua siap!" subtitle="Data kamu akan digunakan untuk menghitung target kalori harian">
              <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <SummaryRow label="Tujuan" value={GOAL_OPTIONS.find((g) => g.key === goalType)?.label ?? '-'} colors={colors} />
                <SummaryRow label="Nama" value={name || '-'} colors={colors} />
                <SummaryRow label="Jenis kelamin" value={sex === 'male' ? 'Pria' : sex === 'female' ? 'Wanita' : '-'} colors={colors} />
                <SummaryRow label="Tahun lahir" value={birthYear || '-'} colors={colors} />
                <SummaryRow label="Tinggi" value={height ? `${height} cm` : '-'} colors={colors} />
                <SummaryRow label="Berat" value={weight ? `${weight} kg` : '-'} colors={colors} />
                <SummaryRow label="Aktivitas" value={ACTIVITY_OPTIONS.find((a) => a.key === activity)?.label ?? '-'} colors={colors} last />
              </View>
            </StepLayout>
          )}
        </View>

        <View style={styles.footer}>
          <Button
            title={step === TOTAL_STEPS - 1 ? 'Mulai' : 'Lanjut'}
            onPress={handleNext}
            disabled={!canNext()}
            loading={saving}
          />
        </View>
      </View>
    </Screen>
  )
}

function StepLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const { colors } = useTheme()
  return (
    <View style={stepStyles.container}>
      <Text variant="largeTitle">{title}</Text>
      {subtitle && (
        <Text variant="body" color={colors.textSecondary} style={stepStyles.subtitle}>
          {subtitle}
        </Text>
      )}
      <View style={stepStyles.options}>{children}</View>
    </View>
  )
}

const stepStyles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.sm,
  },
  subtitle: {
    marginTop: -Spacing.xs,
  },
  options: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
})

function OptionPill({
  label,
  sub,
  selected,
  onPress,
  colors,
}: {
  label: string
  sub?: string
  selected: boolean
  onPress: () => void
  colors: ReturnType<typeof useTheme>['colors']
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        pillStyles.pill,
        {
          backgroundColor: selected ? colors.primaryMuted : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={pillStyles.textBlock}>
        <Text variant="headline" color={selected ? colors.primary : colors.textPrimary}>
          {label}
        </Text>
        {sub && (
          <Text variant="footnote" color={selected ? colors.primary : colors.textSecondary}>
            {sub}
          </Text>
        )}
      </View>
      {selected && (
        <View style={[pillStyles.check, { backgroundColor: colors.primary }]}>
          <Text variant="caption" color="#FFFFFF">✓</Text>
        </View>
      )}
    </Pressable>
  )
}

const pillStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

function SummaryRow({
  label,
  value,
  colors,
  last,
}: {
  label: string
  value: string
  colors: ReturnType<typeof useTheme>['colors']
  last?: boolean
}) {
  return (
    <View style={[sumStyles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text variant="body" color={colors.textSecondary}>{label}</Text>
      <Text variant="headline">{value}</Text>
    </View>
  )
}

const sumStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingVertical: Spacing.xl,
  },
  sexRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sexCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 20,
  },
})
