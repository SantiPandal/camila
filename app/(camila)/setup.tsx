import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useGame } from '../../src/context/GameContext';
import { COLORS } from '../../src/constants/theme';
import { Player } from '../../src/types';

export default function SetupScreen() {
  const router = useRouter();
  const { wineAnalysis, setPlayers, setTimerDuration, timerDuration, prepareGameOptions, resetGame } = useGame();

  const wineIcons = {
    red: require('../../assets/icons/icon-wine-red.png'),
    white: require('../../assets/icons/icon-wine-white.png'),
    sparkling: require('../../assets/icons/icon-champagne.png'),
    'rosé': require('../../assets/icons/icon-wine-red.png'),
  } as const;
  const wineIcon = wineIcons[wineAnalysis?.wine_type ?? 'red'];
  const [playerNames, setPlayerNames] = useState(['', '']);

  const addPlayer = () => {
    if (playerNames.length < 8) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPlayerNames([...playerNames, '']);
    }
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > 2) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPlayerNames(playerNames.filter((_, i) => i !== index));
    }
  };

  const updateName = (index: number, name: string) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated);
  };

  const startGame = () => {
    const players: Player[] = playerNames.map((name, i) => ({
      id: String(i),
      name: name.trim() || `Player ${i + 1}`,
      score: 0,
      guesses: { aromas: [], flavors: [], body: '', tannins: '', acidity: '', finish: '' },
    }));
    setPlayers(players);
    prepareGameOptions();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/game');
  };

  const timerOptions = [30, 45, 60, 90];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => { resetGame(); router.replace('/home'); }} activeOpacity={0.7}>
          <Text style={styles.title}>Camila</Text>
        </TouchableOpacity>

        {wineAnalysis && (
          <View style={styles.wineCard}>
            <Image source={wineIcon} style={styles.wineIcon} resizeMode="contain" />
            <View style={styles.wineInfo}>
              <Text style={styles.wineName}>{wineAnalysis.wine_name}</Text>
              <Text style={styles.wineRegion}>
                {wineAnalysis.region_emoji} {wineAnalysis.region}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Players</Text>
        {playerNames.map((name, i) => (
          <View key={i} style={styles.playerRow}>
            <TextInput
              style={styles.playerInput}
              placeholder={`Player ${i + 1}`}
              placeholderTextColor={COLORS.gray400}
              value={name}
              onChangeText={(text) => updateName(i, text)}
              maxLength={20}
            />
            {playerNames.length > 2 && (
              <TouchableOpacity onPress={() => removePlayer(i)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {playerNames.length < 8 && (
          <TouchableOpacity onPress={addPlayer} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add Player</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Time per Turn</Text>
        <View style={styles.timerRow}>
          {timerOptions.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.timerChip, timerDuration === t && styles.timerChipActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setTimerDuration(t);
              }}
            >
              <Text style={[styles.timerText, timerDuration === t && styles.timerTextActive]}>
                {t}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.8}>
          <Text style={styles.startBtnText}>Start Game</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.burgundy },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  title: {
    fontFamily: 'Sacramento_400Regular',
    fontSize: 48,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 24,
  },
  wineCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  wineIcon: {
    width: 72,
    height: 72,
  },
  wineInfo: {
    flex: 1,
  },
  wineName: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  wineRegion: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
    marginTop: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.gray800,
  },
  removeBtn: {
    marginLeft: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { color: COLORS.white, fontSize: 16 },
  addBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  addBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
  timerRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  timerChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  timerChipActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  timerText: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  timerTextActive: { color: COLORS.burgundy },
  startBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  startBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.burgundy },
});
