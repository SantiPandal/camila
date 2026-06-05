import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAmbiciosa } from '../../src/context/AmbiciosaContext';
import { A_COLORS } from '../../src/constants/ambiciosa-theme';

type DoubleOrNothingResult = 'normal' | 'double' | 'nothing';

export default function AmbiciosaWin() {
  const router = useRouter();
  const { players, winner, pricePerPoint, resetGame } = useAmbiciosa();
  const [doubleResults, setDoubleResults] = useState<Record<string, DoubleOrNothingResult>>({});

  const orderedLosers = useMemo(() => (
    winner ? players.filter(p => p.id !== winner.id) : []
  ), [players, winner]);
  const settlements = useMemo(() => (
    winner ? players.map(p => {
      const isWinner = p.id === winner.id;
      const basePayout = Math.max(0, winner.score - p.score) * pricePerPoint;
      const doubleResult = doubleResults[p.id] ?? 'normal';
      const finalPayout = isWinner
        ? 0
        : doubleResult === 'double'
          ? basePayout * 2
          : doubleResult === 'nothing'
            ? 0
            : basePayout;

      return { ...p, isWinner, basePayout, doubleResult, finalPayout };
    }) : []
  ), [players, winner, pricePerPoint, doubleResults]);

  const totalWinnings = settlements.reduce((sum, p) => sum + p.finalPayout, 0);

  if (!winner) return null;

  const newGame = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetGame();
    router.replace('/ambiciosa');
  };

  const setDoubleResult = (playerId: string, result: DoubleOrNothingResult) => {
    Haptics.selectionAsync();
    setDoubleResults(prev => ({ ...prev, [playerId]: result }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.winTitle}>{winner.name} gana!</Text>
        <Text style={styles.winSub}>
          {winner.score} puntos · ${pricePerPoint.toFixed(2)}/pt
        </Text>

        <View style={styles.ruleCard}>
          <Text style={styles.ruleTitle}>Doble o nada</Text>
          <Text style={styles.ruleText}>
            Base: diferencia de puntos x ${pricePerPoint.toFixed(2)}. Si el ganador gana el doble o nada, cobra doble. Si el rival gana, queda en cero.
          </Text>
        </View>

        {orderedLosers.map((p, index) => {
          const settlement = settlements.find(s => s.id === p.id);
          if (!settlement) return null;
          const statusText = settlement.doubleResult === 'double'
            ? `${winner.name} ganó doble`
            : settlement.doubleResult === 'nothing'
              ? `${p.name} ganó nada`
              : 'Sin doble o nada';

          return (
            <View key={p.id} style={styles.doubleCard}>
              <View style={styles.doubleHeader}>
                <View>
                  <Text style={styles.doubleOrder}>Turno {index + 1}</Text>
                  <Text style={styles.doubleName}>{p.name}</Text>
                </View>
                <View style={styles.doubleAmounts}>
                  <Text style={styles.doubleBase}>Base ${settlement.basePayout.toFixed(2)}</Text>
                  <Text style={styles.doubleFinal}>Debe ${settlement.finalPayout.toFixed(2)}</Text>
                </View>
              </View>

              <Text style={styles.doubleStatus}>{statusText}</Text>

              <View style={styles.doubleActions}>
                <TouchableOpacity
                  style={[styles.doubleBtn, settlement.doubleResult === 'nothing' && styles.doubleBtnNothing]}
                  onPress={() => setDoubleResult(p.id, 'nothing')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.doubleBtnText, settlement.doubleResult === 'nothing' && styles.doubleBtnTextNothing]}>
                    Nada
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.doubleBtn, settlement.doubleResult === 'normal' && styles.doubleBtnNormal]}
                  onPress={() => setDoubleResult(p.id, 'normal')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.doubleBtnText, settlement.doubleResult === 'normal' && styles.doubleBtnTextNormal]}>
                    Normal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.doubleBtn, settlement.doubleResult === 'double' && styles.doubleBtnDouble]}
                  onPress={() => setDoubleResult(p.id, 'double')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.doubleBtnText, settlement.doubleResult === 'double' && styles.doubleBtnTextDouble]}>
                    Doble
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <Text style={styles.summaryTitle}>Resumen final</Text>
        {settlements.map(p => (
          <View key={p.id} style={[styles.payoutRow, p.isWinner && styles.payoutWinner]}>
            <View>
              <Text style={styles.payoutName}>
                {p.name} {p.isWinner ? '🏆' : ''}
              </Text>
              {!p.isWinner && (
                <Text style={styles.payoutDetail}>
                  Base ${p.basePayout.toFixed(2)} · {p.doubleResult === 'double' ? 'doble' : p.doubleResult === 'nothing' ? 'nada' : 'normal'}
                </Text>
              )}
            </View>
            <Text style={[styles.payoutAmount, p.isWinner ? styles.payoutGreen : styles.payoutRed]}>
              {p.isWinner ? 'COBRA' : `-$${p.finalPayout.toFixed(2)}`}
            </Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalName}>{winner.name} cobra</Text>
          <Text style={styles.totalAmount}>+${totalWinnings.toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.newGameBtn} onPress={newGame} activeOpacity={0.8}>
          <Text style={styles.newGameText}>Nueva Partida 🎲</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: A_COLORS.emerald },
  scroll: { paddingHorizontal: 24, paddingTop: 80 },
  trophy: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 12,
  },
  winTitle: {
    fontFamily: 'Pacifico_400Regular',
    fontSize: 36,
    color: A_COLORS.gold,
    textAlign: 'center',
    marginBottom: 4,
  },
  winSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 32,
  },
  ruleCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ruleTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: A_COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  ruleText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.62)',
  },
  doubleCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  doubleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  doubleOrder: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  doubleName: {
    fontSize: 19,
    fontWeight: '900',
    color: A_COLORS.white,
  },
  doubleAmounts: {
    alignItems: 'flex-end',
  },
  doubleBase: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    fontVariant: ['tabular-nums'],
  },
  doubleFinal: {
    fontSize: 18,
    fontWeight: '900',
    color: A_COLORS.gold,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  doubleStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.58)',
    marginTop: 10,
    marginBottom: 10,
  },
  doubleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  doubleBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  doubleBtnNothing: {
    backgroundColor: 'rgba(16,185,129,0.18)',
    borderColor: 'rgba(16,185,129,0.34)',
  },
  doubleBtnNormal: {
    backgroundColor: 'rgba(240,192,64,0.18)',
    borderColor: 'rgba(240,192,64,0.34)',
  },
  doubleBtnDouble: {
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderColor: 'rgba(239,68,68,0.34)',
  },
  doubleBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.52)',
  },
  doubleBtnTextNothing: {
    color: A_COLORS.success,
  },
  doubleBtnTextNormal: {
    color: A_COLORS.gold,
  },
  doubleBtnTextDouble: {
    color: '#FCA5A5',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.48)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 10,
    marginBottom: 8,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  payoutWinner: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  payoutName: { fontSize: 17, fontWeight: '700', color: A_COLORS.white },
  payoutDetail: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.38)',
    marginTop: 3,
  },
  payoutAmount: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  payoutRed: { color: A_COLORS.error },
  payoutGreen: { color: A_COLORS.success },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 4,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  totalName: { fontSize: 17, fontWeight: '700', color: A_COLORS.white },
  totalAmount: { fontSize: 22, fontWeight: '800', color: A_COLORS.success, fontVariant: ['tabular-nums'] },
  newGameBtn: {
    backgroundColor: A_COLORS.gold,
    borderRadius: 16,
    minHeight: 60,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  newGameText: { fontSize: 18, fontWeight: '900', color: A_COLORS.emeraldDark },
});
