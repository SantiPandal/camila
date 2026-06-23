import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRaqueta } from '../../src/context/RaquetaContext';
import { R_COLORS } from '../../src/constants/raqueta-theme';
import { SPORT_LABELS } from '../../src/constants/raqueta-defaults';
import {
  nextFire, summarizeWeekdays, formatCountdown, formatPlayDate,
} from '../../src/services/raqueta-schedule';

export default function RaquetaHome() {
  const router = useRouter();
  const { config, loaded } = useRaqueta();
  const [now, setNow] = useState(() => new Date());

  // Tick every 30s to keep the countdown fresh without burning cycles.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const goSetup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/raqueta/setup');
  };

  const activeRules = config.rules.filter(r => r.enabled);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backRow}>
          <Text style={styles.back}>‹ Mini Apps</Text>
        </TouchableOpacity>

        <Text style={styles.emoji}>🎾</Text>
        <Text style={styles.title}>Raqueta</Text>
        <Text style={styles.subtitle}>Reserva automática de canchas</Text>

        <View style={styles.statusBanner}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            Motor sin conectar — el bot vive en el Mac mini, todavía falta la captura de tráfico.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tus reglas</Text>
          <TouchableOpacity onPress={goSetup} activeOpacity={0.7}>
            <Text style={styles.editLink}>Editar</Text>
          </TouchableOpacity>
        </View>

        {loaded && activeRules.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No hay reglas activas.</Text>
            <Text style={styles.emptyHint}>Crea una para decidir qué cancha cazar y cuándo.</Text>
          </View>
        )}

        {activeRules.map(rule => {
          const fire = nextFire(rule, now);
          return (
            <View key={rule.id} style={styles.ruleCard}>
              <View style={styles.ruleTopRow}>
                <Text style={styles.ruleSport}>{SPORT_LABELS[rule.sport] ?? rule.sport}</Text>
                <Text style={styles.ruleSlot}>{rule.slotTime}</Text>
              </View>
              <Text style={styles.ruleDays}>{summarizeWeekdays(rule.weekdays)}</Text>

              <View style={styles.ladderRow}>
                {rule.courtLadder.map((court, i) => (
                  <View key={`${court}-${i}`} style={styles.ladderChip}>
                    <Text style={styles.ladderRank}>{i + 1}</Text>
                    <Text style={styles.ladderCourt}>{court}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.nextRow}>
                {fire ? (
                  <>
                    <Text style={styles.nextLabel}>Próxima apertura</Text>
                    <Text style={styles.nextValue}>
                      en {formatCountdown(fire.fireAt.getTime() - now.getTime())}
                      <Text style={styles.nextSub}>  ·  jugar {formatPlayDate(fire.playDate)}</Text>
                    </Text>
                  </>
                ) : (
                  <Text style={styles.nextNone}>Sin días seleccionados</Text>
                )}
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={styles.primaryBtn} onPress={goSetup} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Editar reglas</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Reservas recientes</Text>
        {config.history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aún no hay reservas.</Text>
            <Text style={styles.emptyHint}>
              Aparecerán aquí en cuanto el motor empiece a cazar canchas.
            </Text>
          </View>
        ) : (
          config.history.slice(0, 8).map(h => (
            <View key={h.id} style={styles.historyRow}>
              <View
                style={[
                  styles.historyDot,
                  h.status === 'won' && { backgroundColor: R_COLORS.success },
                  h.status === 'missed' && { backgroundColor: R_COLORS.warn },
                  h.status === 'error' && { backgroundColor: R_COLORS.error },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle}>
                  {h.court ?? 'Cancha'} · {h.slot ?? '—'}
                </Text>
                <Text style={styles.historySub}>{h.date}{h.note ? ` · ${h.note}` : ''}</Text>
              </View>
              <Text style={styles.historyStatus}>{h.status}</Text>
            </View>
          ))
        )}

        <View style={styles.howCard}>
          <Text style={styles.howTitle}>Cómo funciona</Text>
          <Text style={styles.howText}>
            Las canchas se liberan en un solo lote cada mañana. Un humano llega tarde; un servidor
            no. El motor pre-calienta la sesión y dispara la reserva en el instante exacto de la
            apertura, bajando por tu escalera de canchas hasta ganar una.
          </Text>
          <Text style={styles.howNote}>
            v1 corre headless en tu Mac mini. Esta pantalla define las reglas; el siguiente paso es
            la captura de tráfico (spike) para conectar el motor.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: R_COLORS.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 48 },
  backRow: { marginBottom: 8 },
  back: { color: R_COLORS.muted, fontSize: 15, fontWeight: '600' },
  emoji: { fontSize: 56, textAlign: 'center', marginTop: 8 },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: R_COLORS.line,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: R_COLORS.muted,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 24,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: R_COLORS.warnDim,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    marginBottom: 28,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: R_COLORS.warn,
  },
  statusText: { flex: 1, color: R_COLORS.line, fontSize: 13, lineHeight: 18 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: R_COLORS.line,
    marginTop: 20,
    marginBottom: 12,
  },
  editLink: { color: R_COLORS.clay, fontSize: 15, fontWeight: '700', marginTop: 20 },
  ruleCard: {
    backgroundColor: R_COLORS.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: R_COLORS.cardBorder,
    marginBottom: 14,
  },
  ruleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  ruleSport: { fontSize: 20, fontWeight: '900', color: R_COLORS.line },
  ruleSlot: {
    fontSize: 22,
    fontWeight: '900',
    color: R_COLORS.clay,
    fontVariant: ['tabular-nums'],
  },
  ruleDays: { fontSize: 14, color: R_COLORS.muted, marginTop: 2, marginBottom: 14 },
  ladderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ladderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(201,111,76,0.18)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  ladderRank: {
    fontSize: 11,
    fontWeight: '900',
    color: R_COLORS.clay,
    backgroundColor: 'rgba(201,111,76,0.25)',
    borderRadius: 8,
    width: 18,
    height: 18,
    textAlign: 'center',
    lineHeight: 18,
    overflow: 'hidden',
  },
  ladderCourt: { fontSize: 13, fontWeight: '700', color: R_COLORS.line },
  nextRow: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  nextLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: R_COLORS.faint,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nextValue: { fontSize: 17, fontWeight: '800', color: R_COLORS.line, marginTop: 4 },
  nextSub: { fontSize: 14, fontWeight: '600', color: R_COLORS.muted },
  nextNone: { fontSize: 14, color: R_COLORS.warn, fontWeight: '700' },
  primaryBtn: {
    backgroundColor: R_COLORS.clay,
    borderRadius: 16,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: { fontSize: 17, fontWeight: '900', color: R_COLORS.white },
  emptyCard: {
    backgroundColor: R_COLORS.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: R_COLORS.cardBorder,
    marginBottom: 14,
  },
  emptyText: { fontSize: 15, fontWeight: '700', color: R_COLORS.line },
  emptyHint: { fontSize: 13, color: R_COLORS.muted, marginTop: 4, lineHeight: 18 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: R_COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: R_COLORS.cardBorder,
    marginBottom: 8,
  },
  historyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: R_COLORS.gray400 },
  historyTitle: { fontSize: 15, fontWeight: '700', color: R_COLORS.line },
  historySub: { fontSize: 12, color: R_COLORS.muted, marginTop: 2 },
  historyStatus: {
    fontSize: 11,
    fontWeight: '800',
    color: R_COLORS.muted,
    textTransform: 'uppercase',
  },
  howCard: {
    backgroundColor: 'rgba(46,68,56,0.4)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 28,
  },
  howTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: R_COLORS.clay,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  howText: { fontSize: 14, color: R_COLORS.muted, lineHeight: 21 },
  howNote: {
    fontSize: 13,
    color: R_COLORS.faint,
    lineHeight: 19,
    marginTop: 12,
    fontStyle: 'italic',
  },
});
