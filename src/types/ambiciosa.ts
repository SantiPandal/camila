export interface AmbiciosaPlayer {
  id: string;
  name: string;
  score: number;
}

export type AmbiciosaOptionalRuleId =
  | 'ambitionBust'
  | 'shortCutPenalty'
  | 'droppedDice'
  | 'tripleJack';

export interface AmbiciosaOptionalRule {
  id: AmbiciosaOptionalRuleId;
  name: string;
  shortName: string;
  category: 'Castigos' | 'Dados' | 'Especiales';
  description: string;
  actionLabel?: string;
  points?: number;
}

export type AmbiciosaRuleSettings = Record<AmbiciosaOptionalRuleId, boolean>;

export interface LogEntry {
  id: string;
  playerId: string;
  playerName: string;
  points: number;
  oldScore: number;
  newScore: number;
  round: number;
  note?: string;
}
