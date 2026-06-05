import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, StatusBar, Animated, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAmbiciosa } from '../../src/context/AmbiciosaContext';
import { A_COLORS } from '../../src/constants/ambiciosa-theme';

const BASIC_LOSS_KEYS = [
  { val: -50, label: 'Se paso' },
];

const HOT_KEYS = [
  { val: 100, label: 'One Hondo' },
  { val: 150, label: 'One Fifty' },
  { val: 200, label: 'Two Hondo' },
  { val: 250, label: 'Tufic' },
  { val: 300, label: 'Tri Hondo' },
  { val: 350, label: 'Tri Fifty' },
];

export default function AmbiciosaGame() {
  const router = useRouter();
  const {
    players, currentPlayerIndex, round, pricePerPoint,
    turnScore, log, empateTriggered, activeOptionalRules,
    addToTurn, clearTurn, plantar,
    undoEntry, clearEmpate,
  } = useAmbiciosa();

  const [showScoreboard, setShowScoreboard] = useState(false);
  const empateAnim = useRef(new Animated.Value(0)).current;
  const turnCountRef = useRef(0);

  const currentPlayer = players[currentPlayerIndex];
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const activeScoringRules = activeOptionalRules.filter(rule => typeof rule.points === 'number');
  const activeReminderRules = activeOptionalRules.filter(rule => typeof rule.points !== 'number');
  const lossKeys = [
    ...BASIC_LOSS_KEYS,
    ...activeScoringRules.map(rule => ({
      val: rule.points as number,
      label: rule.actionLabel ?? rule.shortName,
    })),
  ];

  useEffect(() => {
    if (empateTriggered) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.sequence([
        Animated.timing(empateAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(empateAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => clearEmpate());
    }
  }, [empateTriggered]);

  const handleQuick = (pts: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addToTurn(pts);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearTurn();
  };

  const handlePlantar = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const result = plantar();
    turnCountRef.current++;

    if (result === 'win') {
      setTimeout(() => router.push('/ambiciosa/win'), 300);
    } else if (result === 'continue' && turnCountRef.current % 5 === 0) {
      setShowScoreboard(true);
    }
  };

  const displayColor = turnScore > 0 ? A_COLORS.success : turnScore < 0 ? A_COLORS.error : A_COLORS.white;

  const recentLog = log.slice(-8).reverse().filter(e => !e.note);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.roundRow}>
          <Text style={styles.roundText}>Ronda <Text style={styles.roundNum}>{round}</Text></Text>
          <Text style={styles.metaText}>Meta: 3,000</Text>
          <Text style={styles.priceTag}>${pricePerPoint.toFixed(2)}/pt</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {players.map((p, i) => (
            <View
              key={p.id}
              style={[styles.tab, i === currentPlayerIndex && styles.tabActive]}
            >
              <Text style={[styles.tabName, i === currentPlayerIndex && styles.tabNameActive]}>
                {p.name}
              </Text>
              <Text style={[styles.tabScore, i === currentPlayerIndex && styles.tabScoreActive]}>
                {p.score}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current player label */}
        <Text style={styles.currentLabel}>Turno de {currentPlayer?.name}</Text>

        {/* Score display */}
        <View style={styles.display}>
          <Text style={[styles.displayValue, { color: displayColor }]}>
            {turnScore}
          </Text>
          <Text style={styles.displayLabel}>Puntos este turno</Text>
        </View>

        {activeOptionalRules.length > 0 && (
          <View style={styles.activeRulesPanel}>
            <View style={styles.activeRulesHeader}>
              <Text style={styles.activeRulesTitle}>Reglas activas</Text>
              <Text style={styles.activeRulesCount}>{activeOptionalRules.length}</Text>
            </View>
            <View style={styles.activeRuleChips}>
              {activeOptionalRules.map(rule => (
                <View key={rule.id} style={styles.activeRuleChip}>
                  <Text style={styles.activeRuleName}>{rule.shortName}</Text>
                  {typeof rule.points === 'number' && (
                    <Text style={[styles.activeRulePoints, rule.points < 0 ? styles.activeRulePointsNeg : styles.activeRulePointsPos]}>
                      {rule.points > 0 ? '+' : ''}{rule.points}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Piojos */}
        <Text style={styles.sectionLabel}>Piojos</Text>
        <View style={styles.piojoGrid}>
          <TouchableOpacity
            style={[styles.piojoBtn, styles.piojoBtnRed]}
            onPress={() => handleQuick(-200)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Restar Piojo Rojo, doscientos puntos"
          >
            <Text style={styles.piojoIcon}>🎲</Text>
            <View>
              <Text style={styles.piojoVal}>-200 pts</Text>
              <Text style={styles.piojoLabelRed}>Piojo rojo</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.piojoBtn, styles.piojoBtnBlack]}
            onPress={() => handleQuick(-300)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Restar Piojo Negro, trescientos puntos"
          >
            <Text style={styles.piojoIcon}>🎲</Text>
            <View>
              <Text style={styles.piojoVal}>-300 pts</Text>
              <Text style={styles.piojoLabelBlack}>Piojo negro</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Hot keys — common round totals */}
        <Text style={styles.sectionLabel}>Comunes</Text>
        <View style={styles.hotKeyGrid}>
          {HOT_KEYS.map(({ val, label }) => (
            <TouchableOpacity
              key={val}
              style={styles.hotKey}
              onPress={() => handleQuick(val)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Sumar ${val} puntos`}
            >
              <Text style={styles.hotKeyVal}>+{val} pts</Text>
              <Text style={styles.hotKeyLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Small ambition losses */}
        <Text style={styles.sectionLabel}>Perdió</Text>
        <View style={styles.lossGrid}>
          {lossKeys.map(({ val, label }) => (
            <TouchableOpacity
              key={`${label}-${val}`}
              style={styles.lossKey}
              onPress={() => handleQuick(val)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Restar ${Math.abs(val)} puntos`}
            >
              <Text style={styles.lossKeyVal}>{val} pts</Text>
              <Text style={styles.lossKeyLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeReminderRules.length > 0 && (
          <View style={styles.ruleReminderPanel}>
            {activeReminderRules.map(rule => (
              <View key={rule.id} style={styles.ruleReminderRow}>
                <Text style={styles.ruleReminderName}>{rule.name}</Text>
                <Text style={styles.ruleReminderText}>{rule.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action buttons */}
        <TouchableOpacity
          style={styles.plantarBtn}
          onPress={handlePlantar}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Plantar y pasar al siguiente jugador"
        >
          <Text style={styles.plantarText}>Plantar</Text>
        </TouchableOpacity>
        <View style={styles.secondaryActionRow}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
            <Text style={styles.clearText}>Borrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.marcadorBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setShowScoreboard(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.marcadorText}>Marcador</Text>
          </TouchableOpacity>
        </View>

        {/* History */}
        {recentLog.length > 0 && (
          <>
            <Text style={styles.histTitle}>Historial</Text>
            {recentLog.map(entry => (
              <View key={entry.id} style={styles.histEntry}>
                <Text style={styles.histInfo}>{entry.playerName} → {entry.newScore}</Text>
                <Text style={[styles.histPts, entry.points >= 0 ? styles.histPos : styles.histNeg]}>
                  {entry.points >= 0 ? '+' : ''}{entry.points}
                </Text>
                <TouchableOpacity onPress={() => { Haptics.selectionAsync(); undoEntry(entry.id); }}>
                  <Text style={styles.histUndo}>↩</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Scoreboard Modal */}
      <Modal visible={showScoreboard} transparent animationType="fade" onRequestClose={() => setShowScoreboard(false)}>
        <View style={styles.overlay}>
          <View style={styles.scoreSheet}>
            <Text style={styles.scoreTitle}>Marcador</Text>
            <Text style={styles.scoreRound}>Ronda {round} · ${pricePerPoint.toFixed(2)}/pt</Text>
            {sorted.map((p, i) => (
              <View key={p.id} style={[styles.scoreRow, i === 0 && p.score > 0 && styles.scoreRowLeader]}>
                <Text style={styles.scoreName}>{p.name}</Text>
                <Text style={[styles.scoreVal, i === 0 && p.score > 0 && styles.scoreValLeader]}>
                  {p.score}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.scoreCloseBtn}
              onPress={() => setShowScoreboard(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.scoreCloseBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Empate Flash */}
      <Animated.View
        style={[styles.empateFlash, { opacity: empateAnim }]}
        pointerEvents={empateTriggered ? 'auto' : 'none'}
      >
        <Text style={styles.empateText}>EMPATE ARRIBA DE 2,000!</Text>
        <Text style={styles.empateSub}>Todos a cero. Precio se dobla a ${(pricePerPoint).toFixed(2)}/pt</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: A_COLORS.emerald },

  header: {
    backgroundColor: A_COLORS.emeraldDark,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  roundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  roundText: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  roundNum: { fontWeight: '700', color: A_COLORS.white },
  metaText: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  priceTag: { fontSize: 13, fontWeight: '700', color: A_COLORS.gold },
  tabScroll: { paddingHorizontal: 12 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 70,
  },
  tabActive: {
    borderColor: A_COLORS.gold,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabName: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  tabNameActive: { color: A_COLORS.white },
  tabScore: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontVariant: ['tabular-nums'] },
  tabScoreActive: { color: A_COLORS.gold },

  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 },

  currentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 8,
  },

  display: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-end',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  displayValue: {
    fontSize: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  displayLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  activeRulesPanel: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeRulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activeRulesTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.46)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  activeRulesCount: {
    minWidth: 24,
    minHeight: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(240,192,64,0.2)',
    color: A_COLORS.gold,
    overflow: 'hidden',
    textAlign: 'center',
    paddingTop: 3,
    fontSize: 12,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  activeRuleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeRuleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeRuleName: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.72)',
  },
  activeRulePoints: {
    fontSize: 11,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  activeRulePointsPos: { color: A_COLORS.success },
  activeRulePointsNeg: { color: '#FCA5A5' },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.48)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  piojoGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  piojoBtn: {
    flex: 1,
    minHeight: 58,
    borderRadius: 16,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  piojoBtnRed: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderColor: 'rgba(239,68,68,0.38)',
  },
  piojoBtnBlack: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  piojoIcon: {
    fontSize: 20,
  },
  piojoVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FCA5A5',
    fontVariant: ['tabular-nums'],
  },
  piojoLabelRed: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(252,165,165,0.72)',
    marginTop: 3,
  },
  piojoLabelBlack: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.58)',
    marginTop: 3,
  },
  hotKeyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  hotKey: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: 'rgba(240,192,64,0.15)',
    borderRadius: 16,
    minHeight: 56,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.34)',
  },
  hotKeyLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(240,192,64,0.64)',
    textAlign: 'center',
    marginTop: 3,
  },
  hotKeyVal: {
    fontSize: 18,
    fontWeight: '900',
    color: A_COLORS.gold,
    fontVariant: ['tabular-nums'],
    textTransform: 'uppercase',
  },
  lossGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  lossKey: {
    flex: 1,
    minWidth: '30%',
    minHeight: 56,
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  lossKeyVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FCA5A5',
    fontVariant: ['tabular-nums'],
  },
  lossKeyLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(252,165,165,0.68)',
    marginTop: 3,
  },
  ruleReminderPanel: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    marginTop: -2,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ruleReminderRow: {
    marginBottom: 10,
  },
  ruleReminderName: {
    fontSize: 13,
    fontWeight: '900',
    color: A_COLORS.gold,
    marginBottom: 3,
  },
  ruleReminderText: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.58)',
  },

  secondaryActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  plantarBtn: {
    backgroundColor: A_COLORS.gold,
    borderRadius: 16,
    minHeight: 56,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 8,
  },
  plantarText: { fontSize: 19, fontWeight: '900', color: A_COLORS.emeraldDark },
  clearBtn: {
    flex: 1,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 16,
    minHeight: 50,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  clearText: { fontSize: 16, fontWeight: '700', color: '#FCA5A5' },
  marcadorBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    minHeight: 50,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  marcadorText: { fontSize: 16, fontWeight: '700', color: A_COLORS.white },

  histTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  histEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  histInfo: { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  histPts: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'], marginRight: 12 },
  histPos: { color: A_COLORS.success },
  histNeg: { color: A_COLORS.error },
  histUndo: { fontSize: 18, color: 'rgba(255,255,255,0.3)', paddingHorizontal: 4 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scoreSheet: {
    backgroundColor: A_COLORS.emeraldDark,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scoreTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: A_COLORS.gold,
    textAlign: 'center',
    marginBottom: 4,
  },
  scoreRound: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  scoreRowLeader: {
    borderLeftColor: A_COLORS.gold,
  },
  scoreName: { fontSize: 17, fontWeight: '700', color: A_COLORS.white },
  scoreVal: { fontSize: 22, fontWeight: '700', color: A_COLORS.white, fontVariant: ['tabular-nums'] },
  scoreValLeader: { color: A_COLORS.gold },
  scoreCloseBtn: {
    backgroundColor: A_COLORS.gold,
    borderRadius: 16,
    minHeight: 56,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  scoreCloseBtnText: { fontSize: 16, fontWeight: '700', color: A_COLORS.emeraldDark },

  empateFlash: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: A_COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  empateText: {
    fontSize: 24,
    fontWeight: '800',
    color: A_COLORS.white,
    textAlign: 'center',
  },
  empateSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
});
