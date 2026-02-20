export interface WineAnalysis {
  wine_name: string;
  wine_type: 'red' | 'white' | 'rosé' | 'sparkling';
  vintage: string;
  region: string;
  region_emoji: string;
  grape: string;
  characteristics: {
    aromas: string[];
    flavors: string[];
    body: 'light' | 'medium' | 'full';
    tannins: 'low' | 'medium' | 'high';
    acidity: 'low' | 'medium' | 'high';
    finish: 'short' | 'medium' | 'long';
  };
  decoys: {
    aromas: string[];
    flavors: string[];
  };
}

export interface Player {
  id: string;
  name: string;
  score: number;
  guesses: PlayerGuess;
}

export interface PlayerGuess {
  aromas: string[];
  flavors: string[];
  body: string;
  tannins: string;
  acidity: string;
  finish: string;
}

export type GameMode = 'cooperative' | 'competitive';
