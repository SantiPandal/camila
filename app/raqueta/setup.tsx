import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRaqueta } from '../../src/context/RaquetaContext';
import { R_COLORS } from '../../src/constants/raqueta-theme';
import { WEEKDAY_LABELS, SPORT_LABELS } from '../../src/constants/raqueta-defaults';
import { BookingRule, Sport, Weekday } from '../../src/types/raqueta';

function shiftTime(hm: string, deltaMin: number): string {
  const [h, m] = hm.split(':').map(n => parseInt(n, 10) || 0);
  let total = (h * 60 + m + deltaMin + 1440) % 1440;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function TimeStepper({
  label, value, step, onChange,
}: { label: string; value: string; step: number; onChange: (v: string) => void }) {
  const bump = (delta: number) => {
    Haptics.selectionAsync();
    onChange(shiftTime(value, delta));
  };
  return (
    <View style={styles.stepperBlock}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => bump(-step)} activeOpacity={0.7}>
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepValue}>{value}</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={() => bump(step)} activeOpacity={0.7}>
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RaquetaSetup() {
  const router = useRouter();
  const { config, addRule, updateRule, deleteRule } = useRaqueta();

  const toggleWeekday = (rule: BookingRule, day: Weekday) => {
    Haptics.selectionAsync();
    const has = rule.weekdays.includes(day);
    const weekdays = has
      ? rule.weekdays.filter(d => d !== day)
      : [...rule.weekdays, day].sort((a, b) => a - b);
    updateRule(rule.id, { weekdays });
  };

  const setSport = (rule: BookingRule, sport: Sport) => {
    Haptics.selectionAsync();
    updateRule(rule.id, { sport });
  };

  const updateCourt = (rule: BookingRule, index: number, text: string) => {
    const courtLadder = [...rule.courtLadder];
    courtLadder[index] = text;
    updateRule(rule.id, { courtLadder });
  };

  const moveCourtUp = (rule: BookingRule, index: number) => {
    if (index === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const courtLadder = [...rule.courtLadder];
    [courtLadder[index - 1], courtLadder[index]] = [courtLadder[index], courtLadder[index - 1]];
    updateRule(rule.id, { courtLadder });
  };

  const removeCourt = (rule: BookingRule, index: number) => {
    if (rule.courtLadder.length <= 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateRule(rule.id, { courtLadder: rule.courtLadder.filter((_, i) => i !== index) });
  };

  const addCourt = (rule: BookingRule) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateRule(rule.id, { courtLadder: [...rule.courtLadder, ''] });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backRow}>
          <Text style={styles.back}>‹ Listo</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Reglas de reserva</Text>
        <Text style={styles.lead}>
          Cada regla le dice al bot qué cazar: deporte, días, hora del partido y el orden de canchas
          a intentar.
        </Text>

        {config.rules.map((rule, ruleIndex) => (
          <View key={rule.id} style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <Text style={styles.ruleHeaderText}>Regla {ruleIndex + 1}</Text>
              <View style={styles.ruleHeaderRight}>
                <Switch
                  value={rule.enabled}
                  onValueChange={() => { Haptics.selectionAsync(); updateRule(rule.id, { enabled: !rule.enabled }); }}
                  trackColor={{ false: 'rgba(255,255,255,0.16)', true: 'rgba(201,111,76,0.6)' }}
                  thumbColor={rule.enabled ? R_COLORS.clay : R_COLORS.gray300}
                  ios_backgroundColor="rgba(255,255,255,0.16)"
                />
                {config.rules.length > 1 && (
                  <TouchableOpacity onPress={() => deleteRule(rule.id)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={styles.fieldLabel}>Deporte</Text>
            <View style={styles.sportRow}>
              {(['padel', 'tennis'] as Sport[]).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sportChip, rule.sport === s && styles.sportChipActive]}
                  onPress={() => setSport(rule, s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sportChipText, rule.sport === s && styles.sportChipTextActive]}>
                    {SPORT_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Días para jugar</Text>
            <View style={styles.daysRow}>
              {WEEKDAY_LABELS.map(w => {
                const active = rule.weekdays.includes(w.day);
                return (
                  <TouchableOpacity
                    key={w.day}
                    style={[styles.dayChip, active && styles.dayChipActive]}
                    onPress={() => toggleWeekday(rule, w.day)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{w.short}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.timesRow}>
              <TimeStepper
                label="Hora del partido"
                value={rule.slotTime}
                step={30}
                onChange={v => updateRule(rule.id, { slotTime: v })}
              />
              <TimeStepper
                label="Apertura (lote)"
                value={rule.dropTime}
                step={15}
                onChange={v => updateRule(rule.id, { dropTime: v })}
              />
            </View>

            <Text style={styles.fieldLabel}>Escalera de canchas</Text>
            <Text style={styles.fieldHint}>En orden de prioridad. El bot baja hasta ganar una.</Text>
            {rule.courtLadder.map((court, i) => (
              <View key={i} style={styles.courtRow}>
                <Text style={styles.courtRank}>{i + 1}</Text>
                <TextInput
                  style={styles.courtInput}
                  placeholder={`Cancha ${i + 1}`}
                  placeholderTextColor={R_COLORS.gray400}
                  value={court}
                  onChangeText={t => updateCourt(rule, i, t)}
                  maxLength={20}
                />
                <TouchableOpacity
                  style={[styles.courtBtn, i === 0 && styles.courtBtnDisabled]}
                  onPress={() => moveCourtUp(rule, i)}
                  disabled={i === 0}
                >
                  <Text style={styles.courtBtnText}>↑</Text>
                </TouchableOpacity>
                {rule.courtLadder.length > 1 && (
                  <TouchableOpacity style={styles.courtBtn} onPress={() => removeCourt(rule, i)}>
                    <Text style={styles.courtBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addCourtBtn} onPress={() => addCourt(rule)} activeOpacity={0.7}>
              <Text style={styles.addCourtText}>+ Agregar cancha</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addRuleBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); addRule(); }}
          activeOpacity={0.8}
        >
          <Text style={styles.addRuleText}>+ Nueva regla</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back(); }}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>Guardar y volver</Text>
        </TouchableOpacity>
        <Text style={styles.savedHint}>Los cambios se guardan solos.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: R_COLORS.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 48 },
  backRow: { marginBottom: 12 },
  back: { color: R_COLORS.clay, fontSize: 16, fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '900', color: R_COLORS.line },
  lead: { fontSize: 14, color: R_COLORS.muted, lineHeight: 20, marginTop: 6, marginBottom: 22 },
  ruleCard: {
    backgroundColor: R_COLORS.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: R_COLORS.cardBorder,
    marginBottom: 18,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleHeaderText: {
    fontSize: 13,
    fontWeight: '900',
    color: R_COLORS.clay,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ruleHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(248,113,113,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { color: R_COLORS.error, fontSize: 14, fontWeight: '800' },
  fieldLabel: { fontSize: 14, fontWeight: '800', color: R_COLORS.line, marginTop: 16, marginBottom: 8 },
  fieldHint: { fontSize: 12, color: R_COLORS.muted, marginTop: -4, marginBottom: 10 },
  sportRow: { flexDirection: 'row', gap: 10 },
  sportChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sportChipActive: { backgroundColor: 'rgba(201,111,76,0.2)', borderColor: R_COLORS.clay },
  sportChipText: { fontSize: 15, fontWeight: '700', color: R_COLORS.muted },
  sportChipTextActive: { color: R_COLORS.line },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayChip: {
    width: 38,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dayChipActive: { backgroundColor: R_COLORS.clay, borderColor: R_COLORS.clay },
  dayChipText: { fontSize: 15, fontWeight: '800', color: R_COLORS.muted },
  dayChipTextActive: { color: R_COLORS.white },
  timesRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  stepperBlock: { flex: 1 },
  stepperLabel: { fontSize: 13, fontWeight: '700', color: R_COLORS.muted, marginBottom: 8 },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(201,111,76,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 22, fontWeight: '800', color: R_COLORS.clay, lineHeight: 24 },
  stepValue: {
    fontSize: 20,
    fontWeight: '900',
    color: R_COLORS.line,
    fontVariant: ['tabular-nums'],
  },
  courtRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  courtRank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(201,111,76,0.22)',
    color: R_COLORS.clay,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 26,
    overflow: 'hidden',
  },
  courtInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: R_COLORS.gray800,
  },
  courtBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courtBtnDisabled: { opacity: 0.3 },
  courtBtnText: { color: R_COLORS.line, fontSize: 15, fontWeight: '800' },
  addCourtBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addCourtText: { color: R_COLORS.muted, fontSize: 14, fontWeight: '800' },
  addRuleBtn: {
    borderWidth: 1.5,
    borderColor: R_COLORS.clay,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  addRuleText: { color: R_COLORS.clay, fontSize: 16, fontWeight: '900' },
  doneBtn: {
    backgroundColor: R_COLORS.clay,
    borderRadius: 16,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { fontSize: 17, fontWeight: '900', color: R_COLORS.white },
  savedHint: { fontSize: 12, color: R_COLORS.faint, textAlign: 'center', marginTop: 12 },
});
