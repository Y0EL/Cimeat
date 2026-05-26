import { Text, TextInput, View } from 'react-native'
import type { FoodAnalysis } from '@cimeat/types'
import { CimitMascot } from '~/components/cimit/cimit-mascot'
import { TtsButton } from '~/components/cimit/tts-button'

export type EditableAnalysis = {
  food_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

function scoreColor(score: number): { bg: string; fg: string } {
  if (score >= 70) return { bg: '#dcfce7', fg: '#16a34a' }
  if (score >= 40) return { bg: '#fef9c3', fg: '#ca8a04' }
  return { bg: '#fee2e2', fg: '#dc2626' }
}

export function HealthScoreBadge({ score }: { score: number }) {
  const c = scoreColor(score)
  return (
    <View className="items-center rounded-2xl px-3 py-2" style={{ backgroundColor: c.bg }}>
      <Text className="font-display text-xl font-extrabold" style={{ color: c.fg }}>
        {score}
      </Text>
      <Text className="font-sans text-[10px] font-semibold uppercase tracking-wide" style={{ color: c.fg }}>
        skor sehat
      </Text>
    </View>
  )
}

type Props = {
  analysis: FoodAnalysis
  edit: EditableAnalysis
  onChange: (patch: Partial<EditableAnalysis>) => void
  transcript?: string
}

export function AnalysisResultCard({ analysis, edit, onChange, transcript }: Props) {
  return (
    <View className="rounded-card bg-white p-4 dark:bg-zinc-900">
      {transcript ? (
        <View className="mb-3 rounded-2xl bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
          <Text className="font-sans text-xs text-zinc-500 dark:text-zinc-400">Yang lo bilang</Text>
          <Text className="mt-0.5 font-sans text-sm text-zinc-700 dark:text-zinc-200">
            &ldquo;{transcript}&rdquo;
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-start gap-3">
        <View className="flex-1">
          <Text className="mb-1 font-sans text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Makanan
          </Text>
          <TextInput
            value={edit.food_name}
            onChangeText={(v) => onChange({ food_name: v })}
            className="rounded-input bg-zinc-100 px-3 py-2 font-sans text-base font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </View>
        <HealthScoreBadge score={analysis.health_score} />
      </View>

      <View className="mt-3 flex-row gap-2">
        <MacroField label="Kalori" value={edit.calories} onChange={(n) => onChange({ calories: n })} />
        <MacroField label="Protein" value={edit.protein_g} onChange={(n) => onChange({ protein_g: n })} />
        <MacroField label="Karbo" value={edit.carbs_g} onChange={(n) => onChange({ carbs_g: n })} />
        <MacroField label="Lemak" value={edit.fat_g} onChange={(n) => onChange({ fat_g: n })} />
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Text className="font-sans text-[11px] text-zinc-400">
          Estimasi {analysis.estimated_weight_g} g · range {analysis.calorie_range.min}-
          {analysis.calorie_range.max} kkal
        </Text>
        <Text className="font-sans text-[11px] text-zinc-400">
          yakin {Math.round(analysis.confidence_score * 100)}%
        </Text>
      </View>

      <View className="mt-3 flex-row items-start gap-2 rounded-2xl bg-primary-50 px-3 py-2.5 dark:bg-primary-950">
        <CimitMascot size={32} />
        <Text className="flex-1 font-sans text-sm leading-5 text-zinc-700 dark:text-zinc-200">
          {analysis.cimit_message}
        </Text>
        <TtsButton text={analysis.cimit_message} size={16} />
      </View>
    </View>
  )
}

function MacroField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <View className="flex-1">
      <Text className="mb-1 text-center font-sans text-[10px] font-semibold uppercase text-zinc-400">
        {label}
      </Text>
      <TextInput
        value={String(value)}
        onChangeText={(v) => onChange(Number(v.replace(/[^0-9.]/g, '')) || 0)}
        keyboardType="decimal-pad"
        className="rounded-input bg-zinc-100 px-2 py-2 text-center font-sans text-sm font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
      />
    </View>
  )
}
