import { BookingRule, Weekday } from '../types/raqueta';
import { WEEKDAY_LABELS } from '../constants/raqueta-defaults';

export interface NextFire {
  fireAt: Date; // when the club releases courts and the bot would fire
  playDate: Date; // the day you'd actually play (drop releases next-day courts)
}

function parseHM(hm: string): [number, number] {
  const [h, m] = hm.split(':').map(n => parseInt(n, 10));
  return [isNaN(h) ? 0 : h, isNaN(m) ? 0 : m];
}

/**
 * The club releases next-day courts at `dropTime` each morning, so to play on a
 * target weekday the bot fires the morning BEFORE. Returns the soonest such
 * instant still in the future, scanning two weeks out.
 */
export function nextFire(rule: BookingRule, now: Date = new Date()): NextFire | null {
  if (rule.weekdays.length === 0) return null;
  const [h, m] = parseHM(rule.dropTime);

  for (let offset = 0; offset < 14; offset++) {
    const fireAt = new Date(now);
    fireAt.setDate(now.getDate() + offset);
    fireAt.setHours(h, m, 0, 0);
    if (fireAt.getTime() <= now.getTime()) continue;

    const playDate = new Date(fireAt);
    playDate.setDate(fireAt.getDate() + 1);
    if (rule.weekdays.includes(playDate.getDay() as Weekday)) {
      return { fireAt, playDate };
    }
  }
  return null;
}

export function summarizeWeekdays(weekdays: Weekday[]): string {
  if (weekdays.length === 0) return 'Ningún día';
  if (weekdays.length === 7) return 'Todos los días';
  const ordered = WEEKDAY_LABELS.filter(w => weekdays.includes(w.day));
  return ordered.map(w => w.long.slice(0, 3)).join(' · ');
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'ahora';
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export function formatPlayDate(d: Date): string {
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}
