import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Animated, Image, ScrollView, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useGame } from '../src/context/GameContext';
import { COLORS } from '../src/constants/theme';
import { PlayerGuess } from '../src/types';

type Phase = 'ready' | 'playing' | 'timesup' | 'passing';

const WINE_ICONS: Record<string, any> = {
  red: require('../assets/icons/icon-wine-red.png'),
  white: require('../assets/icons/icon-wine-white.png'),
  sparkling: require('../assets/icons/icon-champagne.png'),
  'rosé': require('../assets/icons/icon-wine-red.png'),
};

export default function GameScreen() {
  const router = useRouter();
  const {
    players, currentPlayerIndex, setCurrentPlayerIndex,
    timerDuration, shuffledAromas, shuffledFlavors,
    wineAnalysis, submitGuess, calculateScores,
  } = useGame();

  const [phase, setPhase] = useState<Phase>('ready');
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [selectedAromas, setSelectedAromas] = useState<string[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [selectedBody, setSelectedBody] = useState('');
  const [selectedTannins, setSelectedTannins] = useState('');
  const [selectedAcidity, setSelectedAcidity] = useState('');
  const [selectedFinish, setSelectedFinish] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentPlayer = players[currentPlayerIndex];
  const isRed = wineAnalysis?.wine_type === 'red';

  const transitionTo = (callback: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    });
  };

  const resetSelections = () => {
    setSelectedAromas([]);
    setSelectedFlavors([]);
    setSelectedBody('');
    setSelectedTannins('');
    setSelectedAcidity('');
    setSelectedFinish('');
    setTimeLeft(timerDuration);
  };

  const startTurn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    transitionTo(() => {
      setPhase('playing');
      setTimeLeft(timerDuration);
    });
  };

  useEffect(() => {
    if (phase !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase('timesup');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return 0;
        }
        if (prev <= 6) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 5 && timeLeft > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [timeLeft, phase]);

  const handleSubmit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const guess: PlayerGuess = {
      aromas: selectedAromas,
      flavors: selectedFlavors,
      body: selectedBody,
      tannins: selectedTannins,
      acidity: selectedAcidity,
      finish: selectedFinish,
    };
    submitGuess(currentPlayer.id, guess);

    if (currentPlayerIndex < players.length - 1) {
      transitionTo(() => setPhase('passing'));
    } else {
      calculateScores();
      setTimeout(() => router.push('/results'), 300);
    }
  }, [selectedAromas, selectedFlavors, selectedBody, selectedTannins, selectedAcidity, selectedFinish, currentPlayerIndex]);

  useEffect(() => {
    if (phase === 'timesup') {
      setTimeout(handleSubmit, 1500);
    }
  }, [phase, handleSubmit]);

  const nextPlayer = () => {
    transitionTo(() => {
      resetSelections();
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setPhase('ready');
    });
  };

  const toggleChip = (item: string, selected: string[], setSelected: (s: string[]) => void) => {
    Haptics.selectionAsync();
    setSelected(
      selected.includes(item)
        ? selected.filter(s => s !== item)
        : [...selected, item]
    );
  };

  const selectSingle = (value: string, current: string, setter: (s: string) => void) => {
    Haptics.selectionAsync();
    setter(current === value ? '' : value);
  };

  if (phase === 'ready') {
    return (
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <StatusBar barStyle="light-content" />
        <Image source={WINE_ICONS[wineAnalysis?.wine_type ?? 'red']} style={styles.overlayIcon} resizeMode="contain" />
        <Text style={styles.overlayTitle}>{currentPlayer?.name}</Text>
        <Text style={styles.overlaySubtitle}>Your turn! Don't let others see.</Text>
        <TouchableOpacity style={styles.readyBtn} onPress={startTurn} activeOpacity={0.8}>
          <Text style={styles.readyBtnText}>I'm Ready</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (phase === 'passing') {
    const nextP = players[currentPlayerIndex + 1];
    return (
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <StatusBar barStyle="light-content" />
        <Image source={require('../assets/icons/icon-phone.png')} style={styles.overlayIcon} resizeMode="contain" />
        <Text style={styles.overlayTitle}>Pass the phone to</Text>
        <Text style={styles.overlayName}>{nextP?.name}</Text>
        <TouchableOpacity style={styles.readyBtn} onPress={nextPlayer} activeOpacity={0.8}>
          <Text style={styles.readyBtnText}>Ready</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.playerName}>{currentPlayer?.name}</Text>
          <Animated.View style={[
            styles.timerBadge,
            timeLeft <= 10 && styles.timerDanger,
            { transform: [{ scale: timeLeft <= 5 ? pulseAnim : 1 }] },
          ]}>
            <Text style={[styles.timerText, timeLeft <= 10 && styles.timerDangerText]}>
              {timeLeft}s
            </Text>
          </Animated.View>
        </View>

        {phase === 'timesup' && (
          <View style={styles.timesUpBanner}>
            <Text style={styles.timesUpText}>Time's up!</Text>
          </View>
        )}
        <View style={styles.sectionRow}>
          <Image source={require('../assets/icons/icon-nose.png')} style={styles.sectionIcon} resizeMode="contain" />
          <View style={styles.sectionTextWrap}>
            <Text style={styles.sectionLabel}>Nose (Aromas)</Text>
          </View>
          <Text style={styles.counterBadge}>{selectedAromas.length}/3</Text>
        </View>
        <View style={styles.chipGrid}>
          {shuffledAromas.map(aroma => (
            <TouchableOpacity
              key={aroma}
              style={[styles.chip, selectedAromas.includes(aroma) && styles.chipSelected]}
              onPress={() => toggleChip(aroma, selectedAromas, setSelectedAromas)}
              disabled={phase === 'timesup'}
            >
              <Text style={[styles.chipText, selectedAromas.includes(aroma) && styles.chipTextSelected]}>
                {aroma}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Image source={require('../assets/icons/icon-flavors.png')} style={styles.sectionIcon} resizeMode="contain" />
          <View style={styles.sectionTextWrap}>
            <Text style={styles.sectionLabel}>Palate (Flavors)</Text>
          </View>
          <Text style={styles.counterBadge}>{selectedFlavors.length}/3</Text>
        </View>
        <View style={styles.chipGrid}>
          {shuffledFlavors.map(flavor => (
            <TouchableOpacity
              key={flavor}
              style={[styles.chip, selectedFlavors.includes(flavor) && styles.chipSelected]}
              onPress={() => toggleChip(flavor, selectedFlavors, setSelectedFlavors)}
              disabled={phase === 'timesup'}
            >
              <Text style={[styles.chipText, selectedFlavors.includes(flavor) && styles.chipTextSelected]}>
                {flavor}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Image source={require('../assets/icons/icon-body.png')} style={styles.sectionIcon} resizeMode="contain" />
          <View style={styles.sectionTextWrap}>
            <Text style={styles.sectionLabel}>Body</Text>
            <Text style={styles.sectionHint}>How heavy does the wine feel in your mouth?</Text>
          </View>
        </View>
        <View style={styles.optionRow}>
          {(['light', 'medium', 'full'] as const).map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.optionChip, selectedBody === opt && styles.optionSelected]}
              onPress={() => selectSingle(opt, selectedBody, setSelectedBody)}
              disabled={phase === 'timesup'}
            >
              <Text style={[styles.optionText, selectedBody === opt && styles.optionTextSelected]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isRed && (
          <>
            <View style={styles.sectionRow}>
              <Image source={require('../assets/icons/icon-tannins.png')} style={styles.sectionIcon} resizeMode="contain" />
              <View style={styles.sectionTextWrap}>
                <Text style={styles.sectionLabel}>Tannins</Text>
                <Text style={styles.sectionHint}>That dry, gripping feeling on your tongue and gums.</Text>
              </View>
            </View>
            <View style={styles.optionRow}>
              {(['low', 'medium', 'high'] as const).map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionChip, selectedTannins === opt && styles.optionSelected]}
                  onPress={() => selectSingle(opt, selectedTannins, setSelectedTannins)}
                  disabled={phase === 'timesup'}
                >
                  <Text style={[styles.optionText, selectedTannins === opt && styles.optionTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={styles.sectionRow}>
          <Image source={require('../assets/icons/icon-acidity.png')} style={styles.sectionIcon} resizeMode="contain" />
          <View style={styles.sectionTextWrap}>
            <Text style={styles.sectionLabel}>Acidity</Text>
            <Text style={styles.sectionHint}>How much does it make your mouth water?</Text>
          </View>
        </View>
        <View style={styles.optionRow}>
          {(['low', 'medium', 'high'] as const).map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.optionChip, selectedAcidity === opt && styles.optionSelected]}
              onPress={() => selectSingle(opt, selectedAcidity, setSelectedAcidity)}
              disabled={phase === 'timesup'}
            >
              <Text style={[styles.optionText, selectedAcidity === opt && styles.optionTextSelected]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Image source={require('../assets/icons/icon-tongue.png')} style={styles.sectionIcon} resizeMode="contain" />
          <View style={styles.sectionTextWrap}>
            <Text style={styles.sectionLabel}>Finish</Text>
            <Text style={styles.sectionHint}>How long does the flavor linger after you swallow?</Text>
          </View>
        </View>
        <View style={styles.optionRow}>
          {(['short', 'medium', 'long'] as const).map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.optionChip, selectedFinish === opt && styles.optionSelected]}
              onPress={() => selectSingle(opt, selectedFinish, setSelectedFinish)}
              disabled={phase === 'timesup'}
            >
              <Text style={[styles.optionText, selectedFinish === opt && styles.optionTextSelected]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={phase === 'timesup'}
        >
          <Text style={styles.submitBtnText}>Lock In Guesses</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.burgundy },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  overlayIcon: { width: 216, height: 216, marginBottom: 20 },
  overlayTitle: { fontSize: 32, fontWeight: '700', color: COLORS.white, marginBottom: 8 },
  overlaySubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 40 },
  overlayName: { fontSize: 36, fontWeight: '800', color: COLORS.gold, marginTop: 8, marginBottom: 40 },
  readyBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 60,
  },
  readyBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.burgundy },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  playerName: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  timerBadge: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timerDanger: { backgroundColor: COLORS.error },
  timerText: { fontSize: 18, fontWeight: '800', color: COLORS.burgundy },
  timerDangerText: { color: COLORS.white },
  timesUpBanner: {
    backgroundColor: COLORS.error,
    paddingVertical: 8,
    alignItems: 'center',
  },
  timesUpText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 80 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    gap: 8,
  },
  sectionIcon: { width: 36, height: 36 },
  sectionEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
  sectionTextWrap: { flex: 1 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  sectionHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  counterBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gold,
    marginLeft: 'auto',
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipSelected: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  chipText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  chipTextSelected: { color: COLORS.burgundy, fontWeight: '600' },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  optionSelected: { backgroundColor: COLORS.white, borderColor: COLORS.white },
  optionText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  optionTextSelected: { color: COLORS.burgundy },
  submitBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 28,
  },
  submitBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.burgundyDark },
});
