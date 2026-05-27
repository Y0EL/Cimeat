import { Camera, Flame, MessageCircle } from 'lucide-react-native'
import { Image, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import iconImage from '~/assets/icon.png'
import { GoogleSignInButton } from '~/components/google-sign-in-button'
import { useLang, type Lang } from '~/lib/lang-context'

const LANG_OPTIONS: { key: Lang; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'en', label: 'EN' },
  { key: 'zh', label: '中' },
]

function hasOAuthConfigured(): boolean {
  if (typeof process === 'undefined') return false
  return Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ||
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ||
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
  )
}

export default function LoginScreen() {
  const ready = hasOAuthConfigured()
  const { lang, setLang } = useLang()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7F4' }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', overflow: 'hidden', borderRadius: 99, backgroundColor: '#F0EEE9' }}>
          {LANG_OPTIONS.map((opt) => {
            const active = lang === opt.key
            return (
              <Pressable
                key={opt.key}
                onPress={() => setLang(opt.key)}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
                style={{ paddingHorizontal: 14, paddingVertical: 6, backgroundColor: active ? '#FF6B35' : 'transparent' }}
              >
                <Text style={{ fontFamily: active ? 'Outfit_700Bold' : 'Outfit_400Regular', fontSize: 12, color: active ? '#ffffff' : '#8A8886' }}>
                  {opt.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 32, paddingTop: 24 }}>
        <View>
          <Image
            source={iconImage}
            style={{ width: 64, height: 64, borderRadius: 20 }}
            resizeMode="cover"
          />
          <Text style={{ marginTop: 32, fontFamily: 'Outfit_900Black', fontSize: 38, lineHeight: 46, color: '#1A1C1E' }}>
            Lacak kalori,{'\n'}gampang banget.
          </Text>
          <Text style={{ marginTop: 12, maxWidth: 300, fontFamily: 'Outfit_400Regular', fontSize: 16, lineHeight: 26, color: '#8A8886' }}>
            Foto makanan, catat, dan tau target kalori lo. Ditemani AI Diet Coach yang ngerti makan lo.
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <Feature icon={<Camera size={20} color="#FF6B35" />} title="Foto makanan" body="AI hitung kalori & makro otomatis." />
          <Feature icon={<Flame size={20} color="#FF6B35" />} title="Target harian" body="Lihat sisa kalori lo tiap hari." />
          <Feature icon={<MessageCircle size={20} color="#FF6B35" />} title="AI Diet Coach" body="Tanya apa aja soal makanan & target." />
        </View>

        <View style={{ gap: 12 }}>
          {ready ? (
            <GoogleSignInButton />
          ) : (
            <View style={{ borderRadius: 20, backgroundColor: '#FFF3EE', padding: 16 }}>
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#FF6B35' }}>
                Google Sign In belum aktif
              </Text>
              <Text style={{ marginTop: 4, fontFamily: 'Outfit_400Regular', fontSize: 13, lineHeight: 20, color: '#8A8886' }}>
                Isi EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB di apps/mobile/.env lalu restart server.
              </Text>
            </View>
          )}
          <Text style={{ textAlign: 'center', fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 18, color: '#D0CEC9' }}>
            Dengan lanjut lo setuju ke ketentuan dan kebijakan privasi Cimeat.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, backgroundColor: '#FFFFFF', padding: 16 }}>
      <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#FFF3EE' }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#1A1C1E' }}>{title}</Text>
        <Text style={{ marginTop: 2, fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A8886' }}>{body}</Text>
      </View>
    </View>
  )
}
