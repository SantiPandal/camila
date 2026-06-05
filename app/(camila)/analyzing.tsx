import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image, StatusBar, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useGame } from '../../src/context/GameContext';
import { analyzeWine } from '../../src/services/wine-analyzer';
import { COLORS } from '../../src/constants/theme';

const CARD_HEIGHT = 260;

export default function AnalyzingScreen() {
  const router = useRouter();
  const { wineImage, setWineAnalysis } = useGame();
  const [status, setStatus] = useState('Reading the label...');
  const [error, setError] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    Animated.sequence([
      Animated.timing(fillAnim, {
        toValue: CARD_HEIGHT * 0.1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(fillAnim, {
        toValue: CARD_HEIGHT * 0.06,
        duration: 200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(fillAnim, {
        toValue: CARD_HEIGHT * 0.7,
        duration: 5000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false,
      }),
    ]).start();

    Animated.timing(progressAnim, { toValue: 0.7, duration: 8000, useNativeDriver: false }).start();
  }, []);

  useEffect(() => {
    if (!wineImage) return;

    const analyze = async () => {
      try {
        setStatus('Reading the label...');
        const base64 = (global as any).__wineBase64 as string;
        if (!base64) throw new Error('No image data found');

        setStatus('Consulting the sommelier...');
        const analysis = await analyzeWine(base64);

        Animated.spring(fillAnim, {
          toValue: CARD_HEIGHT,
          tension: 50,
          friction: 8,
          useNativeDriver: false,
        }).start();
        Animated.timing(progressAnim, { toValue: 1, duration: 500, useNativeDriver: false }).start();
        setStatus('Wine identified!');
        setWineAnalysis(analysis);

        setTimeout(() => router.push('/setup'), 800);
      } catch (err: any) {
        setError(err.message || 'Failed to analyze wine');
      }
    };

    analyze();
  }, [wineImage]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.title}>Camila</Text>

      <View style={styles.cardWrapper}>
        <Animated.View style={[styles.card, { transform: [{ scale: pulseAnim }] }]}>
          {wineImage && (
            <Animated.View style={[styles.fillContainer, { height: fillAnim }]}>
              <Image
                source={{ uri: wineImage }}
                style={styles.wineImage}
                resizeMode="cover"
              />
              <View style={styles.wineTint} />
            </Animated.View>
          )}
        </Animated.View>
      </View>

      <Text style={styles.status}>{error || status}</Text>

      {error ? (
        <Text
          style={styles.retry}
          onPress={() => router.back()}
        >
          Tap to try again
        </Text>
      ) : (
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      )}
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
    fontSize: 48,
    color: COLORS.white,
    marginBottom: 40,
  },
  cardWrapper: {
    marginBottom: 40,
  },
  card: {
    width: 200,
    height: 260,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  fillContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  wineImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 200,
    height: CARD_HEIGHT,
  },
  wineTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(128, 0, 32, 0.25)',
  },
  status: {
    fontSize: 18,
    color: COLORS.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  retry: {
    fontSize: 16,
    color: COLORS.gold,
    textDecorationLine: 'underline',
  },
  progressBar: {
    width: '80%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    backgroundColor: COLORS.white,
    borderRadius: 3,
  },
});
