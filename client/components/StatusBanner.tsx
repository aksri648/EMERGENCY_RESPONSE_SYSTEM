import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import { CallStatus } from '@/hooks/useLiveKitRoom';

interface Props {
  status: CallStatus;
  alertedDept: string | null;
}

function deptLabel(d: string | null): string {
  if (!d) return '';
  return d.charAt(0).toUpperCase() + d.slice(1);
}

export default function StatusBanner({ status, alertedDept }: Props) {
  const { text, color } = compute(status, alertedDept);
  return (
    <View style={[styles.wrap, { backgroundColor: color.bg, borderColor: color.border }]}>
      <Text style={[styles.text, { color: color.fg }]}>{text}</Text>
    </View>
  );
}

function compute(status: CallStatus, alertedDept: string | null) {
  if (status === 'alerted' && alertedDept) {
    return {
      text: `🚨 ${deptLabel(alertedDept)} Alerted ✓`,
      color: { bg: '#3a0000', fg: theme.redGlow, border: theme.red },
    };
  }
  if (status === 'assessing') {
    return {
      text: 'Assessing situation…',
      color: { bg: '#2a2200', fg: theme.yellow, border: theme.yellow },
    };
  }
  if (status === 'connected') {
    return {
      text: 'ARIA Connected ●',
      color: { bg: '#062014', fg: theme.green, border: theme.green },
    };
  }
  if (status === 'connecting') {
    return {
      text: 'Connecting to ARIA…',
      color: { bg: '#13131e', fg: '#aaaacc', border: '#2a2a3e' },
    };
  }
  if (status === 'disconnected') {
    return {
      text: 'Call ended',
      color: { bg: '#13131e', fg: theme.muted, border: '#2a2a3e' },
    };
  }
  if (status === 'error') {
    return {
      text: 'Connection failed — tap End to retry',
      color: { bg: '#3a0000', fg: theme.redGlow, border: theme.red },
    };
  }
  return {
    text: '',
    color: { bg: '#13131e', fg: theme.muted, border: '#2a2a3e' },
  };
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radiusLg,
    borderWidth: 1,
    alignItems: 'center',
  },
  text: { fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
});
