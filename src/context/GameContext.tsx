import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { WineAnalysis, Player, GameMode, PlayerGuess } from '../types';

interface GameState {
  wineImage: string | null;
  wineAnalysis: WineAnalysis | null;
  players: Player[];
  gameMode: GameMode;
  timerDuration: number;
  currentPlayerIndex: number;
  shuffledAromas: string[];
  shuffledFlavors: string[];
  setWineImage: (uri: string) => void;
  setWineAnalysis: (analysis: WineAnalysis) => void;
  setPlayers: (players: Player[]) => void;
  setGameMode: (mode: GameMode) => void;
  setTimerDuration: (duration: number) => void;
  setCurrentPlayerIndex: (index: number) => void;
  submitGuess: (playerId: string, guess: PlayerGuess) => void;
  calculateScores: () => void;
  prepareGameOptions: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameState | undefined>(undefined);

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [wineImage, setWineImage] = useState<string | null>(null);
  const [wineAnalysis, setWineAnalysis] = useState<WineAnalysis | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('competitive');
  const [timerDuration, setTimerDuration] = useState(60);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [shuffledAromas, setShuffledAromas] = useState<string[]>([]);
  const [shuffledFlavors, setShuffledFlavors] = useState<string[]>([]);

  const prepareGameOptions = useCallback(() => {
    if (!wineAnalysis) return;
    setShuffledAromas(shuffle([
      ...wineAnalysis.characteristics.aromas,
      ...wineAnalysis.decoys.aromas,
    ]));
    setShuffledFlavors(shuffle([
      ...wineAnalysis.characteristics.flavors,
      ...wineAnalysis.decoys.flavors,
    ]));
  }, [wineAnalysis]);

  const submitGuess = useCallback((playerId: string, guess: PlayerGuess) => {
    setPlayers(prev => prev.map(p =>
      p.id === playerId ? { ...p, guesses: guess } : p
    ));
  }, []);

  const calculateScores = useCallback(() => {
    if (!wineAnalysis) return;
    const correct = wineAnalysis.characteristics;

    setPlayers(prev => prev.map(player => {
      let score = 0;
      const g = player.guesses;

      g.aromas.forEach(a => {
        score += correct.aromas.includes(a) ? 2 : -1;
      });
      g.flavors.forEach(f => {
        score += correct.flavors.includes(f) ? 2 : -1;
      });

      if (g.body === correct.body) score += 3;
      if (g.tannins === correct.tannins) score += 3;
      if (g.acidity === correct.acidity) score += 3;
      if (g.finish === correct.finish) score += 3;

      return { ...player, score: Math.max(0, score) };
    }));
  }, [wineAnalysis]);

  const resetGame = useCallback(() => {
    setWineImage(null);
    setWineAnalysis(null);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setShuffledAromas([]);
    setShuffledFlavors([]);
  }, []);

  return (
    <GameContext.Provider value={{
      wineImage, wineAnalysis, players, gameMode, timerDuration,
      currentPlayerIndex, shuffledAromas, shuffledFlavors,
      setWineImage, setWineAnalysis, setPlayers, setGameMode,
      setTimerDuration, setCurrentPlayerIndex, submitGuess,
      calculateScores, prepareGameOptions, resetGame,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
