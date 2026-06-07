import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '@/constants/theme';
import { uploadPhoto } from '@/services/api';

export default function UploadScreen() {
  const router = useRouter();
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera blocked', 'Please enable camera access in Settings.');
      return;
    }
    const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!r.canceled && r.assets[0]) setLocalUri(r.assets[0].uri);
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Gallery blocked', 'Please enable photo access in Settings.');
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!r.canceled && r.assets[0]) setLocalUri(r.assets[0].uri);
  };

  const uploadAndContinue = async () => {
    if (!localUri) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadPhoto(localUri);
      router.replace({ pathname: '/call', params: { photoUrl: url } });
    } catch (e) {
      setError('Upload failed. Tap to retry.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Send a photo to ARIA</Text>
      <Text style={styles.subheading}>
        Optional — helps responders understand the scene. Skip if it puts you at risk.
      </Text>

      {localUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: localUri }} style={styles.preview} resizeMode="cover" />
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>📷</Text>
        </View>
      )}

      <View style={styles.row}>
        <TouchableOpacity style={styles.secondary} onPress={pickFromCamera} activeOpacity={0.8}>
          <Text style={styles.secondaryText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={pickFromGallery} activeOpacity={0.8}>
          <Text style={styles.secondaryText}>From Gallery</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <TouchableOpacity onPress={uploadAndContinue} activeOpacity={0.8}>
          <Text style={styles.error}>{error}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.cta, !localUri && styles.ctaDisabled]}
        onPress={uploadAndContinue}
        disabled={!localUri || uploading}
        activeOpacity={0.85}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.ctaText}>UPLOAD & CONTINUE</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skip}
        onPress={() => router.replace('/call')}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Skip — call without photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg, padding: 24, paddingTop: 80 },
  heading: { color: theme.white, fontSize: 22, fontWeight: '700' },
  subheading: { color: theme.muted, fontSize: 14, marginTop: 8, marginBottom: 24, lineHeight: 20 },
  previewWrap: { borderRadius: theme.radiusLg, overflow: 'hidden', marginBottom: 24 },
  preview: { width: '100%', aspectRatio: 4 / 3 },
  placeholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: theme.surface,
    borderRadius: theme.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  placeholderText: { fontSize: 48, opacity: 0.4 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  secondary: {
    flex: 1,
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryText: { color: theme.white, fontWeight: '600' },
  cta: {
    backgroundColor: theme.red,
    height: 56,
    borderRadius: theme.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1.5 },
  skip: { alignItems: 'center', marginTop: 16 },
  skipText: { color: theme.muted, fontSize: 13 },
  error: { color: theme.redGlow, textAlign: 'center', marginVertical: 8 },
});
