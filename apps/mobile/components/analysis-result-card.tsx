import { Sparkles } from 'lucide-react-native'
import { Text, TextInput, View } from 'react-native'
import type { FoodAnalysis } from '@cimeat/types'
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
    <View style={{ alignItems: 'center', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: c.bg }}>
      <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 20, color: c.fg }}>
        {score}
      </Text>
      <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: c.fg }}>
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
    <View style={{ borderRadius: 24, backgroundColor: '#FFFFFF', padding: 16, shadowColor: '#1A1C1E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
      {transcript ? (
        <View style={{ marginBottom: 12, borderRadius: 16, backgroundColor: '#F8F7F4', paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: '#8A8886' }}>Yang lo bilang</Text>
          <Text style={{ marginTop: 2, fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#1A1C1E' }}>
            &ldquo;{transcript}&rdquo;
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ marginBottom: 4, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: '#8A8886' }}>
            Makanan
          </Text>
          <TextInput
            value={edit.food_name}
            onChangeText={(v) => onChange({ food_name: v })}
            style={{ borderRadius: 14, backgroundColor: '#F8F7F4', paddingHorizontal: 12, paddingVertical: 8, fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#1A1C1E' }}
          />
        </View>
        <HealthScoreBadge score={analysis.health_score} />
      </View>

      <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
        <MacroField label="Kalori" value={edit.calories} onChange={(n) => onChange({ calories: n })} />
        <MacroField label="Protein" value={edit.protein_g} onChange={(n) => onChange({ protein_g: n })} />
        <MacroField label="Karbo" value={edit.carbs_g} onChange={(n) => onChange({ carbs_g: n })} />
        <MacroField label="Lemak" value={edit.fat_g} onChange={(n) => onChange({ fat_g: n })} />
      </View>

      <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#8A8886' }}>
          Estimasi {analysis.estimated_weight_g} g · range {analysis.calorie_range.min}-{analysis.calorie_range.max} kkal
        </Text>
        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#8A8886' }}>
          yakin {Math.round(analysis.confidence_score * 100)}%
        </Text>
      </View>

      <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 20, backgroundColor: '#2A2D30', paddingHorizontal: 14, paddingVertical: 12 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={13} color="#ffffff" />
        </View>
        <Text style={{ flex: 1, fontFamily: 'Outfit_400Regular', fontSize: 13, lineHeight: 20, color: '#F8F7F4' }}>
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
    <View style={{ flex: 1 }}>
      <Text style={{ marginBottom: 4, textAlign: 'center', fontFamily: 'Outfit_700Bold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: '#8A8886' }}>
        {label}
      </Text>
      <TextInput
        value={String(value)}
        onChangeText={(v) => onChange(Number(v.replace(/[^0-9.]/g, '')) || 0)}
        keyboardType="decimal-pad"
        style={{ borderRadius: 14, backgroundColor: '#F8F7F4', paddingHorizontal: 8, paddingVertical: 8, textAlign: 'center', fontFamily: 'Outfit_700Bold', fontSize: 13, color: '#1A1C1E' }}
      />
    </View>
  )
}
