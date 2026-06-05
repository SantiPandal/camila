import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  AmbiciosaOptionalRule,
  AmbiciosaOptionalRuleId,
  AmbiciosaPlayer,
  AmbiciosaRuleSettings,
  LogEntry,
} from '../types/ambiciosa';
import {
  AMBICIOSA_OPTIONAL_RULES,
  DEFAULT_AMBICIOSA_RULE_SETTINGS,
} from '../constants/ambiciosa-rules';

interface AmbiciosaState {
  players: AmbiciosaPlayer[];
  currentPlayerIndex: number;
  round: number;
  pricePerPoint: number;
  turnScore: number;
  log: LogEntry[];
  winner: AmbiciosaPlayer | null;
  empateTriggered: boolean;
  optionalRules: AmbiciosaRuleSettings;
  activeOptionalRules: AmbiciosaOptionalRule[];

  setPlayers: (players: AmbiciosaPlayer[]) => void;
  setPricePerPoint: (price: number) => void;
  setRuleEnabled: (ruleId: AmbiciosaOptionalRuleId, enabled: boolean) => void;
  toggleRule: (ruleId: AmbiciosaOptionalRuleId) => void;
  addToTurn: (points: number) => void;
  setTurnScore: (score: number) => void;
  clearTurn: () => void;
  toggleSign: () => void;
  plantar: () => 'continue' | 'empate' | 'win';
  showScoreboard: () => AmbiciosaPlayer[];
  undoEntry: (logId: string) => void;
  clearEmpate: () => void;
  resetGame: () => void;
}

const AmbiciosaContext = createContext<AmbiciosaState | undefined>(undefined);

let logCounter = 0;

export function AmbiciosaProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<AmbiciosaPlayer[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [turnInRound, setTurnInRound] = useState(0);
  const [pricePerPoint, setPricePerPoint] = useState(1);
  const [turnScore, setTurnScore] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [winner, setWinner] = useState<AmbiciosaPlayer | null>(null);
  const [empateTriggered, setEmpateTriggered] = useState(false);
  const [optionalRules, setOptionalRules] = useState<AmbiciosaRuleSettings>(
    DEFAULT_AMBICIOSA_RULE_SETTINGS
  );

  const activeOptionalRules = AMBICIOSA_OPTIONAL_RULES.filter(rule => optionalRules[rule.id]);

  const setRuleEnabled = useCallback((ruleId: AmbiciosaOptionalRuleId, enabled: boolean) => {
    setOptionalRules(prev => ({ ...prev, [ruleId]: enabled }));
  }, []);

  const toggleRule = useCallback((ruleId: AmbiciosaOptionalRuleId) => {
    setOptionalRules(prev => ({ ...prev, [ruleId]: !prev[ruleId] }));
  }, []);

  const addToTurn = useCallback((points: number) => {
    setTurnScore(prev => prev + points);
  }, []);

  const clearTurn = useCallback(() => {
    setTurnScore(0);
  }, []);

  const toggleSign = useCallback(() => {
    setTurnScore(prev => -prev);
  }, []);

  const plantar = useCallback((): 'continue' | 'empate' | 'win' => {
    if (turnScore === 0) return 'continue';

    const player = players[currentPlayerIndex];
    const oldScore = player.score;
    const newScore = oldScore + turnScore;

    const updatedPlayers = players.map((p, i) =>
      i === currentPlayerIndex ? { ...p, score: newScore } : p
    );

    const entry: LogEntry = {
      id: String(++logCounter),
      playerId: player.id,
      playerName: player.name,
      points: turnScore,
      oldScore,
      newScore,
      round,
    };

    setPlayers(updatedPlayers);
    setLog(prev => [...prev, entry]);
    setTurnScore(0);

    const maxScore = Math.max(...updatedPlayers.map(p => p.score));
    if (maxScore > 2000) {
      const leaders = updatedPlayers.filter(p => p.score === maxScore);
      if (leaders.length >= 2) {
        setPlayers(updatedPlayers.map(p => ({ ...p, score: 0 })));
        setPricePerPoint(prev => prev * 2);
        setRound(1);
        setTurnInRound(0);
        setCurrentPlayerIndex(0);
        setEmpateTriggered(true);
        setLog(prev => [...prev, {
          id: String(++logCounter),
          playerId: '',
          playerName: 'EMPATE',
          points: 0,
          oldScore: 0,
          newScore: 0,
          round: 0,
          note: `Reset! Precio se dobla`,
        }]);
        return 'empate';
      }
    }

    if (newScore >= 3000) {
      setWinner({ ...player, score: newScore });
      return 'win';
    }

    const nextTurn = turnInRound + 1;
    setTurnInRound(nextTurn);
    if (nextTurn > 0 && nextTurn % players.length === 0) {
      setRound(prev => prev + 1);
    }
    setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);

    return 'continue';
  }, [players, currentPlayerIndex, turnScore, round, turnInRound]);

  const showScoreboard = useCallback(() => {
    return [...players].sort((a, b) => b.score - a.score);
  }, [players]);

  const undoEntry = useCallback((logId: string) => {
    const entry = log.find(e => e.id === logId);
    if (!entry || entry.note) return;

    setPlayers(prev => prev.map(p =>
      p.id === entry.playerId ? { ...p, score: entry.oldScore } : p
    ));
    setLog(prev => prev.filter(e => e.id !== logId));
    setTurnInRound(prev => Math.max(0, prev - 1));
  }, [log]);

  const clearEmpate = useCallback(() => {
    setEmpateTriggered(false);
  }, []);

  const resetGame = useCallback(() => {
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setRound(1);
    setTurnInRound(0);
    setPricePerPoint(1);
    setTurnScore(0);
    setLog([]);
    setWinner(null);
    setEmpateTriggered(false);
    setOptionalRules(DEFAULT_AMBICIOSA_RULE_SETTINGS);
  }, []);

  return (
    <AmbiciosaContext.Provider value={{
      players, currentPlayerIndex, round, pricePerPoint,
      turnScore, log, winner, empateTriggered,
      optionalRules, activeOptionalRules,
      setPlayers, setPricePerPoint, setRuleEnabled, toggleRule,
      addToTurn, setTurnScore,
      clearTurn, toggleSign, plantar, showScoreboard,
      undoEntry, clearEmpate, resetGame,
    }}>
      {children}
    </AmbiciosaContext.Provider>
  );
}

export function useAmbiciosa() {
  const context = useContext(AmbiciosaContext);
  if (!context) throw new Error('useAmbiciosa must be used within AmbiciosaProvider');
  return context;
}
