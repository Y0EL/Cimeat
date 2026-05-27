import { Text, View, type ViewStyle } from 'react-native'
import { useThemeColors } from '~/lib/theme'

function renderInline(line: string, keyPrefix: string, color: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={`${keyPrefix}-b-${i}`} style={{ fontFamily: 'Outfit_700Bold', color }}>
          {part.slice(2, -2)}
        </Text>
      )
    }
    return part
  })
}

export function MarkdownText({ text, style }: { text: string; style?: ViewStyle }) {
  const c = useThemeColors()
  const lines = text.split('\n')
  return (
    <View style={style}>
      {lines.map((raw, i) => {
        const line = raw.trimEnd()
        if (!line.trim()) return <View key={i} style={{ height: 6 }} />

        if (line.startsWith('### ')) {
          return (
            <Text key={i} style={{ marginTop: 8, marginBottom: 4, fontFamily: 'Outfit_700Bold', fontSize: 14, color: c.text }}>
              {line.slice(4)}
            </Text>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <Text key={i} style={{ marginTop: 8, marginBottom: 4, fontFamily: 'Outfit_700Bold', fontSize: 16, color: c.text }}>
              {line.slice(3)}
            </Text>
          )
        }
        if (line.startsWith('# ')) {
          return (
            <Text key={i} style={{ marginTop: 8, marginBottom: 4, fontFamily: 'Outfit_900Black', fontSize: 18, color: c.text }}>
              {line.slice(2)}
            </Text>
          )
        }

        const bullet = line.match(/^[-*]\s+(.*)$/)
        if (bullet) {
          return (
            <View key={i} style={{ marginBottom: 2, flexDirection: 'row', gap: 8 }}>
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: c.orange }}>•</Text>
              <Text style={{ flex: 1, fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 20, color: c.textSub }}>
                {renderInline(bullet[1] ?? '', String(i), c.text)}
              </Text>
            </View>
          )
        }

        const numbered = line.match(/^(\d+)\.\s+(.*)$/)
        if (numbered) {
          return (
            <View key={i} style={{ marginBottom: 2, flexDirection: 'row', gap: 8 }}>
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: c.orange }}>{numbered[1]}.</Text>
              <Text style={{ flex: 1, fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 20, color: c.textSub }}>
                {renderInline(numbered[2] ?? '', String(i), c.text)}
              </Text>
            </View>
          )
        }

        return (
          <Text key={i} style={{ marginBottom: 2, fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 20, color: c.textSub }}>
            {renderInline(line, String(i), c.text)}
          </Text>
        )
      })}
    </View>
  )
}
