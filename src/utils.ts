import { BlockData } from './types';
import { GRID_COLS, MAX_BLOCK_VALUE, MIN_BLOCK_VALUE } from './constants';

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const generateRow = (row: number): BlockData[] => {
  return Array.from({ length: GRID_COLS }, (_, col) => ({
    id: generateId(),
    value: Math.floor(Math.random() * (MAX_BLOCK_VALUE - MIN_BLOCK_VALUE + 1)) + MIN_BLOCK_VALUE,
    row,
    col,
  }));
};

export const calculateTarget = (grid: BlockData[]): number => {
  if (grid.length === 0) return 10;
  
  // Pick 2-4 random blocks to sum up for a guaranteed solvable target
  const count = Math.floor(Math.random() * 3) + 2;
  const shuffled = [...grid].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(count, grid.length));
  
  return selected.reduce((sum, b) => sum + b.value, 0);
};
