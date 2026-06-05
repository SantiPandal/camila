import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { A_COLORS } from '../../src/constants/ambiciosa-theme';

export default function AmbiciosaHome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Text style={styles.dice}>🎲</Text>
      <Text style={styles.title}>Ambisiosa</Text>
      <Text style={styles.subtitle}>Cubilete — Marcador</Text>

      <TouchableOpacity
        style={styles.startBtn}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/ambiciosa/setup');
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.startBtnText}>Nueva Partida</Text>
      </TouchableOpacity>

      <View style={styles.rulesCard}>
        <Text style={styles.rulesTitle}>Como se juega</Text>
        <Text style={styles.rulesText}>
          Primero a 3,000 puntos gana.{'\n'}
          As = +100 · Rey = +50{'\n'}
          Piojo Rojo = -200 · Piojo Negro = -300{'\n'}
          Empate arriba de 2,000 = todos a cero.
        </Text>
      </View>

      <Text style={styles.footer}>Tira los dados. Acumula puntos. Gana.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: A_COLORS.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  dice: {
    fontSize: 80,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Pacifico_400Regular',
    fontSize: 52,
    color: A_COLORS.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 48,
    letterSpacing: 1,
  },
  startBtn: {
    backgroundColor: A_COLORS.gold,
    borderRadius: 16,
    minHeight: 60,
    paddingVertical: 16,
    paddingHorizontal: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 32,
  },
  startBtnText: {
    fontSize: 20,
    fontWeight: '900',
    color: A_COLORS.emeraldDark,
  },
  rulesCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: A_COLORS.gold,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rulesText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.5,
  },
});
