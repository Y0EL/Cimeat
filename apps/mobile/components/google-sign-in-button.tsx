import { Pressable, Text, View } from 'react-native'
import { useGoogleSignIn } from '~/hooks/use-google-sign-in'

export function GoogleSignInButton() {
  const { signIn, signingIn, isReady, error } = useGoogleSignIn()

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Lanjut pakai Google"
        disabled={!isReady || signingIn}
        onPress={signIn}
        style={({ pressed }) => ({
          alignItems: 'center',
          borderRadius: 99,
          backgroundColor: '#FF6B35',
          paddingVertical: 16,
          opacity: pressed || !isReady || signingIn ? 0.6 : 1,
        })}
      >
        <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#ffffff' }}>
          {signingIn ? 'Lagi masuk' : 'Lanjut pakai Google'}
        </Text>
      </Pressable>
      {error ? (
        <Text style={{ marginTop: 8, textAlign: 'center', fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#ef4444' }}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}
