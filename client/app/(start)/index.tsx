import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

export default function Landing() {
  const router = useRouter();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <View style={styles.root}>
      <View style={styles.logoWrap}>
        <View style={styles.logoRing}>
          <Text style={styles.logoShield}>🛡</Text>
        </View>
      </View>

      <View style={styles.ctaWrap}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRing,
            { transform: [{ scale: ringScale }], opacity: ringOpacity },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] }) }],
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }),
            },
          ]}
        />

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          android_ripple={{ color: '#ff5252', borderless: false }}
          onPress={() => router.push('/call')}
        >
          <MaterialCommunityIcons
            name="phone-classic"
            size={56}
            color="#fff"
            style={styles.ctaIcon}
          />
          <Text style={styles.ctaText}>EMERGENCY</Text>
          <Text style={styles.ctaSub}>Tap to call ARIA dispatcher</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.uploadLink, pressed && { opacity: 0.5 }]}
        onPress={() => router.push('/upload')}
      >
        <Text style={styles.uploadLinkText}>Upload Photo First →</Text>
      </Pressable>

      <Text style={styles.footer}>ARIA Emergency Response System</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: { marginBottom: 40 },
  logoRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: theme.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.redGlow,
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  logoShield: { fontSize: 60 },
  ctaWrap: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  pulseRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: theme.red,
  },
  cta: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: theme.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.redGlow,
    shadowOpacity: 0.9,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
    borderWidth: 4,
    borderColor: '#ff4d4d',
  },
  ctaPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: '#b91c1c',
  },
  ctaIcon: {
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 6,
  },
  ctaText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 4,
  },
  ctaSub: {
    color: '#ffe0e0',
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  uploadLink: { marginTop: 4 },
  uploadLinkText: { color: '#aaaacc', fontSize: 14 },
  footer: {
    position: 'absolute',
    bottom: 32,
    color: theme.muted,
    fontSize: 12,
    letterSpacing: 1,
  },
});
