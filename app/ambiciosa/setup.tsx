import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAmbiciosa } from '../../src/context/AmbiciosaContext';
import { A_COLORS } from '../../src/constants/ambiciosa-theme';
import { AMBICIOSA_OPTIONAL_RULES } from '../../src/constants/ambiciosa-rules';
import { AmbiciosaPlayer } from '../../src/types/ambiciosa';

export default function AmbiciosaSetup() {
  const router = useRouter();
  const { setPlayers, setPricePerPoint, resetGame, optionalRules, setRuleEnabled } = useAmbiciosa();
  const [names, setNames] = useState<string[]>(['', '']);
  const [price, setPrice] = useState(1);

  const addPlayer = () => {
    if (names.length < 6) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setNames([...names, '']);
    }
  };

  const removePlayer = (index: number) => {
    if (names.length > 2) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setNames(names.filter((_, i) => i !== index));
    }
  };

  const updateName = (index: number, name: string) => {
    const updated = [...names];
    updated[index] = name;
    setNames(updated);
  };

  const startGame = () => {
    const players: AmbiciosaPlayer[] = names.map((name, i) => ({
      id: String(i),
      name: name.trim() || `Jugador ${i + 1}`,
      score: 0,
    }));
    setPlayers(players);
    setPricePerPoint(price);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/ambiciosa/game');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => { resetGame(); router.back(); }} activeOpacity={0.7}>
          <Text style={styles.title}>Ambisiosa</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Jugadores</Text>
        {names.map((name, i) => (
          <View key={i} style={styles.playerRow}>
            <TextInput
              style={styles.playerInput}
              placeholder={`Jugador ${i + 1}`}
              placeholderTextColor={A_COLORS.gray400}
              value={name}
              onChangeText={(text) => updateName(i, text)}
              maxLength={12}
            />
            {names.length > 2 && (
              <TouchableOpacity onPress={() => removePlayer(i)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {names.length < 6 && (
          <TouchableOpacity onPress={addPlayer} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Agregar Jugador</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Precio por Punto</Text>
        <View style={styles.priceRow}>
          {[0.25, 0.50, 0.75, 1, 2].map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.priceChip, price === p && styles.priceChipActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setPrice(p);
              }}
            >
              <Text style={[styles.priceChipText, price === p && styles.priceChipTextActive]}>
                ${p < 1 ? p.toFixed(2) : p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Reglas de Mesa</Text>
        <Text style={styles.sectionHint}>Activa solo las variantes que esta partida va a usar.</Text>
        {AMBICIOSA_OPTIONAL_RULES.map(rule => (
          <View key={rule.id} style={styles.ruleRow}>
            <View style={styles.ruleCopy}>
              <View style={styles.ruleTitleRow}>
                <Text style={styles.ruleName}>{rule.name}</Text>
                <Text style={styles.ruleCategory}>{rule.category}</Text>
              </View>
              <Text style={styles.ruleDescription}>{rule.description}</Text>
              {typeof rule.points === 'number' && (
                <Text style={[styles.rulePoints, rule.points < 0 ? styles.rulePointsNeg : styles.rulePointsPos]}>
                  {rule.points > 0 ? '+' : ''}{rule.points} pts
                </Text>
              )}
            </View>
            <Switch
              value={optionalRules[rule.id]}
              onValueChange={(enabled) => {
                Haptics.selectionAsync();
                setRuleEnabled(rule.id, enabled);
              }}
              trackColor={{ false: 'rgba(255,255,255,0.16)', true: 'rgba(240,192,64,0.55)' }}
              thumbColor={optionalRules[rule.id] ? A_COLORS.gold : A_COLORS.gray300}
              ios_backgroundColor="rgba(255,255,255,0.16)"
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.startBtn, names.filter(n => n.trim()).length < 2 && names.length < 2 && styles.startBtnDisabled]}
          onPress={startGame}
          activeOpacity={0.8}
        >
          <Text style={styles.startBtnText}>Empezar 🎲</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: A_COLORS.emerald },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  title: {
    fontFamily: 'Pacifico_400Regular',
    fontSize: 36,
    color: A_COLORS.white,
    textAlign: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: A_COLORS.white,
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
    backgroundColor: A_COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: A_COLORS.gray800,
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
  removeBtnText: { color: A_COLORS.white, fontSize: 16 },
  addBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    borderRadius: 16,
    minHeight: 56,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  addBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '800' },
  priceRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  priceChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    minHeight: 52,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  priceChipActive: {
    backgroundColor: A_COLORS.gold,
    borderColor: A_COLORS.gold,
  },
  priceChipText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  priceChipTextActive: { color: A_COLORS.emeraldDark, fontWeight: '700' },
  sectionHint: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.5)',
    marginTop: -4,
    marginBottom: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ruleCopy: {
    flex: 1,
  },
  ruleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 5,
  },
  ruleName: {
    fontSize: 15,
    fontWeight: '900',
    color: A_COLORS.white,
  },
  ruleCategory: {
    fontSize: 10,
    fontWeight: '900',
    color: A_COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ruleDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.6)',
  },
  rulePoints: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  rulePointsPos: { color: A_COLORS.success },
  rulePointsNeg: { color: '#FCA5A5' },
  startBtn: {
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
    marginTop: 22,
  },
  startBtnDisabled: { opacity: 0.5 },
  startBtnText: { fontSize: 18, fontWeight: '900', color: A_COLORS.emeraldDark },
});
