import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { AudioSession } from '@livekit/react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import { theme } from '@/constants/theme';
import { getToken } from '@/services/api';
import { useLiveKitRoom, CallStatus } from '@/hooks/useLiveKitRoom';
import VoiceOrb, { OrbState } from '@/components/VoiceOrb';
import StatusBanner from '@/components/StatusBanner';
import PhotoPreview from '@/components/PhotoPreview';

const HOLD_TO_END_MS = 2000;

export default function CallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ photoUrl?: string }>();
  const photoUrl = typeof params.photoUrl === 'string' ? params.photoUrl : undefined;

  const identity = useMemo(() => `caller-${uuidv4()}`, []);
  const [tokenInfo, setTokenInfo] = useState<{ token: string; wsUrl: string } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await AudioSession.startAudioSession();
        const t = await getToken({ identity, photoUrl });
        if (!cancelled) setTokenInfo({ token: t.token, wsUrl: t.wsUrl });
      } catch (e) {
        if (!cancelled) setFetchError('Unable to start call. Check your connection.');
      }
    })();
    return () => {
      cancelled = true;
      void AudioSession.stopAudioSession();
    };
  }, [identity, photoUrl]);

  const { status, alertedDept, isAgentSpeaking, isUserSpeaking, disconnect } = useLiveKitRoom({
    wsUrl: tokenInfo?.wsUrl,
    token: tokenInfo?.token,
    enabled: Boolean(tokenInfo),
  });

  const orbState = useMemo<OrbState>(() => {
    if (!tokenInfo || status === 'connecting') return 'connecting';
    if (isAgentSpeaking) return 'agent_speaking';
    if (isUserSpeaking) return 'user_speaking';
    return 'silent';
  }, [tokenInfo, status, isAgentSpeaking, isUserSpeaking]);

  const onCallEnded = async () => {
    await disconnect();
    router.replace('/');
  };

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <StatusBanner
          status={fetchError ? 'error' : (status as CallStatus)}
          alertedDept={alertedDept}
        />
      </View>

      <View style={styles.center}>
        <VoiceOrb state={orbState} size={220} />
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.photoSlot}>
          <PhotoPreview uri={photoUrl} size={60} />
        </View>
        <HoldToHangup onComplete={onCallEnded} />
        <View style={styles.photoSlot} />
      </View>

      {fetchError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      )}

      {!tokenInfo && !fetchError && (
        <View style={styles.loader}>
          <ActivityIndicator color={theme.red} />
        </View>
      )}
    </View>
  );
}

function HoldToHangup({ onComplete }: { onComplete: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [holding, setHolding] = useState(false);

  const start = () => {
    setHolding(true);
    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_TO_END_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animationRef.current.start(({ finished }) => {
      if (finished) {
        setHolding(false);
        onComplete();
      }
    });
  };

  const cancel = () => {
    animationRef.current?.stop();
    setHolding(false);
    Animated.timing(progress, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  return (
    <TouchableWithoutFeedback onPressIn={start} onPressOut={cancel}>
      <View style={styles.endBtn}>
        <Animated.View
          style={[
            styles.endBtnFill,
            {
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
        <Text style={styles.endBtnText}>
          {holding ? 'KEEP HOLDING…' : 'HOLD TO END'}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg, padding: 24, justifyContent: 'space-between' },
  topRow: { marginTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  photoSlot: { width: 60 },
  endBtn: {
    flex: 1,
    height: 64,
    marginHorizontal: 16,
    borderRadius: theme.radiusLg,
    backgroundColor: '#2a0a0a',
    borderWidth: 1,
    borderColor: theme.red,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  endBtnFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.red,
  },
  endBtnText: { color: '#fff', fontWeight: '800', letterSpacing: 2 },
  errorOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 24,
    right: 24,
    backgroundColor: '#3a0000',
    padding: 16,
    borderRadius: 12,
  },
  errorText: { color: theme.redGlow, textAlign: 'center', fontWeight: '600' },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
