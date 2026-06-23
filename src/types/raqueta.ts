export type Sport = 'tennis' | 'padel';

// 0 = Sunday ... 6 = Saturday (matches Date.getDay()).
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface BookingRule {
  id: string;
  enabled: boolean;
  sport: Sport;
  weekdays: Weekday[];
  // Desired match slot, "HH:mm". The court you actually want to play at.
  slotTime: string;
  // Wall-clock instant the club releases next-day courts, "HH:mm".
  dropTime: string;
  // Ordered priority of courts to attempt. Free-form labels until the spike
  // resolves the real IDElemento integers (then label -> id is filled in).
  courtLadder: string[];
}

export type BookingStatus = 'won' | 'missed' | 'error' | 'pending';

export interface BookingRecord {
  id: string;
  ruleId: string;
  date: string; // target play date, yyyy-mm-dd
  status: BookingStatus;
  court?: string;
  slot?: string;
  ts: string; // iso timestamp of the attempt
  note?: string;
}

export interface RaquetaConfig {
  rules: BookingRule[];
  history: BookingRecord[];
}
