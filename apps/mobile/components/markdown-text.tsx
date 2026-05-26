import { Text, View } from 'react-native'

function renderInline(line: string, keyPrefix: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={`${keyPrefix}-b-${i}`} className="font-sans font-bold text-zinc-900 dark:text-zinc-100">
          {part.slice(2, -2)}
        </Text>
      )
    }
    return part
  })
}

export function MarkdownText({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n')
  return (
    <View className={className}>
      {lines.map((raw, i) => {
        const line = raw.trimEnd()
        if (!line.trim()) return <View key={i} style={{ height: 6 }} />

        if (line.startsWith('### ')) {
          return (
            <Text key={i} className="mb-1 mt-2 font-display text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {line.slice(4)}
            </Text>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <Text key={i} className="mb-1 mt-2 font-display text-base font-bold text-zinc-900 dark:text-zinc-100">
              {line.slice(3)}
            </Text>
          )
        }
        if (line.startsWith('# ')) {
          return (
            <Text key={i} className="mb-1 mt-2 font-display text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              {line.slice(2)}
            </Text>
          )
        }

        const bullet = line.match(/^[-*]\s+(.*)$/)
        if (bullet) {
          return (
            <View key={i} className="mb-0.5 flex-row gap-2">
              <Text className="font-sans text-sm text-primary-500">•</Text>
              <Text className="flex-1 font-sans text-sm leading-5 text-zinc-700 dark:text-zinc-200">
                {renderInline(bullet[1] ?? '', String(i))}
              </Text>
            </View>
          )
        }

        const numbered = line.match(/^(\d+)\.\s+(.*)$/)
        if (numbered) {
          return (
            <View key={i} className="mb-0.5 flex-row gap-2">
              <Text className="font-sans text-sm font-semibold text-primary-500">{numbered[1]}.</Text>
              <Text className="flex-1 font-sans text-sm leading-5 text-zinc-700 dark:text-zinc-200">
                {renderInline(numbered[2] ?? '', String(i))}
              </Text>
            </View>
          )
        }

        return (
          <Text key={i} className="mb-0.5 font-sans text-sm leading-5 text-zinc-700 dark:text-zinc-200">
            {renderInline(line, String(i))}
          </Text>
        )
      })}
    </View>
  )
}
