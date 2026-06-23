import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function HubScreen() {
  const router = useRouter();

  const openApp = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Text style={styles.title}>Valencia</Text>
      <Text style={styles.subtitle}>Mini Apps</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={[styles.card, styles.cardCamila]} onPress={() => openApp('/home')} activeOpacity={0.8}>
          <Text style={styles.cardEmoji}>🍷</Text>
          <Text style={styles.cardTitle}>Camila</Text>
          <Text style={styles.cardDesc}>The Wine Guessing Game</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.cardAmbiciosa]} onPress={() => openApp('/ambiciosa')} activeOpacity={0.8}>
          <Text style={styles.cardEmoji}>🎲</Text>
          <Text style={styles.cardTitle}>Ambisiosa</Text>
          <Text style={styles.cardDesc}>Cubilete — Marcador</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.cardRaqueta]} onPress={() => openApp('/raqueta')} activeOpacity={0.8}>
          <Text style={styles.cardEmoji}>🎾</Text>
          <Text style={styles.cardTitle}>Raqueta</Text>
          <Text style={styles.cardDesc}>Reserva automática de canchas</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'Sacramento_400Regular',
    fontSize: 64,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 48,
  },
  grid: {
    width: '100%',
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  cardCamila: {
    backgroundColor: 'rgba(128,0,32,0.3)',
    borderColor: 'rgba(128,0,32,0.5)',
  },
  cardAmbiciosa: {
    backgroundColor: 'rgba(13,59,37,0.4)',
    borderColor: 'rgba(13,59,37,0.6)',
  },
  cardRaqueta: {
    backgroundColor: 'rgba(201,111,76,0.25)',
    borderColor: 'rgba(201,111,76,0.5)',
  },
  cardEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
});
