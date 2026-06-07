import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';
import { theme } from '@/constants/theme';

export type OrbState = 'connecting' | 'agent_speaking' | 'user_speaking' | 'silent';

interface Props {
  state: OrbState;
  size?: number;
}

export default function VoiceOrb({ state, size = 200 }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const userScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    pulse.stopAnimation();
    ring1.stopAnimation();
    ring2.stopAnimation();
    userScale.stopAnimation();

    if (state === 'connecting') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      );
      loop.start();
    } else if (state === 'agent_speaking') {
      const ringLoop = (val: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(val, { toValue: 1, duration: 1400, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
            Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
          ])
        );
      ringLoop(ring1, 0).start();
      ringLoop(ring2, 700).start();
    } else if (state === 'user_speaking') {
      Animated.timing(userScale, {
        toValue: 1.08,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(userScale, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }

    return () => {
      loop?.stop();
    };
  }, [state, pulse, ring1, ring2, userScale]);

  const baseColor = state === 'agent_speaking' ? theme.red : state === 'user_speaking' ? theme.white : '#2a2a36';

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {state === 'agent_speaking' && (
        <>
          <Ring value={ring1} size={size} color={theme.redGlow} />
          <Ring value={ring2} size={size} color={theme.redGlow} />
        </>
      )}
      <Animated.View
        style={[
          styles.orb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: baseColor,
            opacity:
              state === 'connecting'
                ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] })
                : 1,
            transform: [{ scale: userScale }],
          },
        ]}
      />
    </View>
  );
}

function Ring({ value, size, color }: { value: Animated.Value; size: number; color: string }) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
          transform: [
            {
              scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }),
            },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  orb: { position: 'absolute' },
  ring: { position: 'absolute', borderWidth: 2 },
});
