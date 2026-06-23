import { BookingRule, RaquetaConfig, Weekday } from '../types/raqueta';

export const WEEKDAY_LABELS: { day: Weekday; short: string; long: string }[] = [
  { day: 1, short: 'L', long: 'Lunes' },
  { day: 2, short: 'M', long: 'Martes' },
  { day: 3, short: 'X', long: 'Miércoles' },
  { day: 4, short: 'J', long: 'Jueves' },
  { day: 5, short: 'V', long: 'Viernes' },
  { day: 6, short: 'S', long: 'Sábado' },
  { day: 0, short: 'D', long: 'Domingo' },
];

export const SPORT_LABELS: Record<string, string> = {
  tennis: 'Tenis',
  padel: 'Pádel',
};

let ruleCounter = 0;
export function newRuleId(): string {
  return `rule_${Date.now()}_${++ruleCounter}`;
}

export function makeDefaultRule(): BookingRule {
  return {
    id: newRuleId(),
    enabled: true,
    sport: 'padel',
    weekdays: [6, 0], // fin de semana por defecto
    slotTime: '08:00',
    dropTime: '07:00',
    courtLadder: ['Cancha 3', 'Cancha 5', 'Cualquiera'],
  };
}

export const DEFAULT_CONFIG: RaquetaConfig = {
  rules: [makeDefaultRule()],
  history: [],
};
