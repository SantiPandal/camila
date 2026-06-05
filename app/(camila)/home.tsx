import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useGame } from '../../src/context/GameContext';
import { COLORS } from '../../src/constants/theme';
import FeedbackButton from '../../src/components/FeedbackButton';

export default function HomeScreen() {
  const router = useRouter();
  const { setWineImage } = useGame();

  const pickImage = async (useCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    };

    let result;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setWineImage(result.assets[0].uri);
      (global as any).__wineBase64 = result.assets[0].base64;
      router.push('/analyzing');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Text style={styles.title}>Camila</Text>
      <Text style={styles.subtitle}>The Wine Guessing Game</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => pickImage(true)}
          activeOpacity={0.8}
        >
          <Image source={require('../../assets/icons/icon-camera.png')} style={styles.cameraIconImg} />
          <Text style={styles.cameraText}>Take a Photo</Text>
          <Text style={styles.cameraHint}>Snap the bottle or the name from the menu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.galleryButton}
          onPress={() => pickImage(false)}
          activeOpacity={0.7}
        >
          <Text style={styles.galleryText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footer}>Photograph a bottle. Guess the flavors. Win.</Text>
        <FeedbackButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: 'Sacramento_400Regular',
    fontSize: 72,
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 60,
    letterSpacing: 1,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  cameraIconImg: {
    width: 96,
    height: 96,
    marginBottom: 12,
  },
  cameraText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray800,
  },
  cameraHint: {
    fontSize: 14,
    color: COLORS.gray400,
    marginTop: 4,
  },
  galleryButton: {
    marginTop: 20,
    paddingVertical: 14,
  },
  galleryText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textDecorationLine: 'underline',
  },
  footerRow: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footer: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
});
