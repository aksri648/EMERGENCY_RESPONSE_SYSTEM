import { Image, StyleSheet, View } from 'react-native';
import { theme } from '@/constants/theme';

interface Props {
  uri?: string | null;
  size?: number;
}

export default function PhotoPreview({ uri, size = 60 }: Props) {
  if (!uri) return null;
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: 12 }]}>
      <Image source={{ uri }} style={{ width: size, height: size, borderRadius: 12 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.muted,
  },
});
