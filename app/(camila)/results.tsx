import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Image, ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useGame } from '../../src/context/GameContext';
import { COLORS } from '../../src/constants/theme';
import FeedbackButton from '../../src/components/FeedbackButton';

const MEDAL_ICONS: (ImageSourcePropType | null)[] = [
  require('../../assets/icons/icon-medal-gold.png'),
  null,
  null,
];

const WINE_ICONS: Record<string, ImageSourcePropType> = {
  red: require('../../assets/icons/icon-wine-red.png'),
  white: require('../../assets/icons/icon-wine-white.png'),
  sparkling: require('../../assets/icons/icon-champagne.png'),
};

export default function ResultsScreen() {
  const router = useRouter();
  const { players, wineAnalysis, resetGame } = useGame();

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const correct = wineAnalysis?.characteristics;

  const playAgain = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetGame();
    router.replace('/home');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Camila</Text>

        {wineAnalysis && (
          <View style={styles.wineReveal}>
            <Image
              source={WINE_ICONS[wineAnalysis.wine_type] || WINE_ICONS.red}
              style={styles.wineIcon}
              resizeMode="contain"
            />
            <Text style={styles.wineName}>{wineAnalysis.wine_name}</Text>
            <Text style={styles.wineDetail}>{wineAnalysis.grape} · {wineAnalysis.region}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Leaderboard</Text>
        {sorted.map((player, i) => (
          <View key={player.id} style={[styles.playerCard, i === 0 && styles.winnerCard]}>
            <View style={styles.playerLeft}>
              {MEDAL_ICONS[i] ? (
                <Image source={MEDAL_ICONS[i]} style={styles.medalIcon} resizeMode="contain" />
              ) : (
                <Text style={styles.medal}>#{i + 1}</Text>
              )}
              <View>
                <Text style={[styles.playerName, i === 0 && styles.winnerName]}>
                  {player.name}
                </Text>
                <Text style={styles.playerDetail}>
                  {player.guesses.aromas.filter(a => correct?.aromas.includes(a)).length}/
                  {correct?.aromas.length} aromas · {' '}
                  {player.guesses.flavors.filter(f => correct?.flavors.includes(f)).length}/
                  {correct?.flavors.length} flavors
                </Text>
              </View>
            </View>
            <Text style={[styles.score, i === 0 && styles.winnerScore]}>{player.score}</Text>
          </View>
        ))}

        {correct && (
          <>
            <Text style={styles.sectionTitle}>The Answers</Text>
            <View style={styles.answersCard}>
              <Text style={styles.answerLabel}>Aromas</Text>
              <View style={styles.answerChips}>
                {correct.aromas.map(a => (
                  <View key={a} style={styles.correctChip}>
                    <Text style={styles.correctChipText}>{a}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.answerLabel}>Flavors</Text>
              <View style={styles.answerChips}>
                {correct.flavors.map(f => (
                  <View key={f} style={styles.correctChip}>
                    <Text style={styles.correctChipText}>{f}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{correct.body}</Text>
                  <Text style={styles.statLabel}>Body</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{correct.tannins}</Text>
                  <Text style={styles.statLabel}>Tannins</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{correct.acidity}</Text>
                  <Text style={styles.statLabel}>Acidity</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{correct.finish}</Text>
                  <Text style={styles.statLabel}>Finish</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.playAgainBtn} onPress={playAgain} activeOpacity={0.8}>
          <Text style={styles.playAgainText}>Play Again</Text>
        </TouchableOpacity>

        <View style={styles.feedbackRow}>
          <FeedbackButton />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.burgundy },
  scroll: { paddingHorizontal: 24, paddingTop: 60 },
  title: {
    fontFamily: 'Sacramento_400Regular',
    fontSize: 48,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 24,
  },
  wineReveal: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
  },
  wineIcon: { width: 100, height: 100, marginBottom: 8 },
  wineName: { fontSize: 22, fontWeight: '700', color: COLORS.gray800, textAlign: 'center' },
  wineDetail: { fontSize: 14, color: COLORS.gray500, marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
  },
  playerCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  winnerCard: {
    backgroundColor: 'rgba(212,175,55,0.2)',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },
  playerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  medalIcon: { width: 36, height: 36, marginRight: 12 },
  medal: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginRight: 12, width: 36, textAlign: 'center' },
  playerName: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  winnerName: { color: COLORS.gold },
  playerDetail: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  score: { fontSize: 28, fontWeight: '800', color: COLORS.white },
  winnerScore: { color: COLORS.gold },
  answersCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  answerLabel: { fontSize: 14, fontWeight: '700', color: COLORS.gray600, marginBottom: 8, marginTop: 12 },
  answerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  correctChip: {
    backgroundColor: COLORS.successLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  correctChipText: { fontSize: 13, color: '#065F46', fontWeight: '500' },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  statValue: { fontSize: 12, fontWeight: '700', color: COLORS.gray800, textTransform: 'capitalize', textAlign: 'center' },
  statLabel: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
  playAgainBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  playAgainText: { fontSize: 18, fontWeight: '700', color: COLORS.burgundy },
  feedbackRow: { alignItems: 'center', marginTop: 16 },
});
