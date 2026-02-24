export type GameMode = 'classic' | 'time';

export interface BlockData {
  id: string;
  value: number;
  row: number;
  col: number;
  isRemoving?: boolean;
}

export interface GameState {
  grid: BlockData[];
  target: number;
  score: number;
  highScore: number;
  gameOver: boolean;
  selectedIds: string[];
  mode: GameMode;
  timeLeft: number;
  level: number;
}
