/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Play, 
  Timer, 
  ChevronUp, 
  Info,
  X,
  Pause,
  Zap
} from 'lucide-react';
import { BlockData, GameMode, GameState } from './types';
import { 
  GRID_ROWS, 
  GRID_COLS, 
  INITIAL_ROWS, 
  TIME_LIMIT 
} from './constants';
import { generateId, generateRow, calculateTarget } from './utils';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    grid: [],
    target: 0,
    score: 0,
    highScore: parseInt(localStorage.getItem('summerge_highscore') || '0'),
    gameOver: false,
    selectedIds: [],
    mode: 'classic',
    timeLeft: TIME_LIMIT,
    level: 1,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initGame = (mode: GameMode) => {
    let initialGrid: BlockData[] = [];
    for (let i = 0; i < INITIAL_ROWS; i++) {
      initialGrid = [...initialGrid, ...generateRow(i)];
    }
    
    const target = calculateTarget(initialGrid);
    
    setGameState(prev => ({
      ...prev,
      grid: initialGrid,
      target,
      score: 0,
      gameOver: false,
      selectedIds: [],
      mode,
      timeLeft: TIME_LIMIT,
      level: 1,
    }));
    setShowMenu(false);
    setIsPaused(false);
  };

  const addNewRow = useCallback(() => {
    setGameState(prev => {
      // Shift all existing blocks up
      const shiftedGrid = prev.grid.map(block => ({
        ...block,
        row: block.row + 1
      }));
      
      // Check for game over
      const isGameOver = shiftedGrid.some(block => block.row >= GRID_ROWS);
      
      if (isGameOver) {
        if (prev.score > prev.highScore) {
          localStorage.setItem('summerge_highscore', prev.score.toString());
        }
        return { ...prev, gameOver: true, highScore: Math.max(prev.score, prev.highScore) };
      }
      
      // Add new row at bottom (row 0)
      const newRow = generateRow(0);
      return {
        ...prev,
        grid: [...shiftedGrid, ...newRow],
        timeLeft: TIME_LIMIT
      };
    });
  }, []);

  // Timer logic for Time Mode
  useEffect(() => {
    if (gameState.mode === 'time' && !gameState.gameOver && !isPaused && !showMenu) {
      timerRef.current = setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 1) {
            // Time's up! Add row
            setTimeout(() => addNewRow(), 0);
            return { ...prev, timeLeft: TIME_LIMIT };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.mode, gameState.gameOver, isPaused, showMenu, addNewRow]);

  const handleBlockClick = (id: string) => {
    if (gameState.gameOver || isPaused) return;

    setGameState(prev => {
      const isSelected = prev.selectedIds.includes(id);
      const newSelectedIds = isSelected 
        ? prev.selectedIds.filter(sid => sid !== id)
        : [...prev.selectedIds, id];
      
      const currentSum = prev.grid
        .filter(b => newSelectedIds.includes(b.id))
        .reduce((sum, b) => sum + b.value, 0);
      
      if (currentSum === prev.target) {
        // Match!
        const points = newSelectedIds.length * 10 * prev.level;
        let nextGrid = prev.grid.filter(b => !newSelectedIds.includes(b.id));
        let isGameOver = false;
        
        // In classic mode, add a row immediately
        if (prev.mode === 'classic') {
          nextGrid = nextGrid.map(block => ({
            ...block,
            row: block.row + 1
          }));
          
          isGameOver = nextGrid.some(block => block.row >= GRID_ROWS);
          
          if (!isGameOver) {
            const newRow = generateRow(0);
            nextGrid = [...nextGrid, ...newRow];
          }
        }

        if (isGameOver) {
          const finalScore = prev.score + points;
          if (finalScore > prev.highScore) {
            localStorage.setItem('summerge_highscore', finalScore.toString());
          }
          return {
            ...prev,
            score: finalScore,
            gameOver: true,
            highScore: Math.max(finalScore, prev.highScore),
            selectedIds: [],
          };
        }

        return {
          ...prev,
          grid: nextGrid,
          score: prev.score + points,
          selectedIds: [],
          target: calculateTarget(nextGrid),
          timeLeft: TIME_LIMIT,
        };
      } else if (currentSum > prev.target) {
        // Over target, reset selection
        return { ...prev, selectedIds: [] };
      }
      
      return { ...prev, selectedIds: newSelectedIds };
    });
  };

  const currentSum = gameState.grid
    .filter(b => gameState.selectedIds.includes(b.id))
    .reduce((sum, b) => sum + b.value, 0);

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-black/5 flex items-center justify-between px-6 z-30">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-bold text-black/40">Target</span>
            <span className="text-2xl font-bold leading-none text-emerald-600">{gameState.target}</span>
          </div>
          <div className="h-8 w-[1px] bg-black/5 mx-2" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-bold text-black/40">Current</span>
            <span className={`text-2xl font-bold leading-none transition-colors ${currentSum > gameState.target ? 'text-red-500' : 'text-black'}`}>
              {currentSum}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider font-bold text-black/40">High Score</span>
            <span className="text-sm font-bold">{gameState.highScore}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider font-bold text-black/40">Score</span>
            <span className="text-xl font-bold text-indigo-600">{gameState.score}</span>
          </div>
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="pt-24 pb-12 px-4 max-w-lg mx-auto h-screen flex flex-col">
        {/* Mode & Timer Info */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-black/5 shadow-sm">
            <Zap size={14} className="text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-tight">
              {gameState.mode === 'classic' ? 'Classic Mode' : 'Time Mode'}
            </span>
          </div>
          
          {gameState.mode === 'time' && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-black/5 shadow-sm">
              <Timer size={14} className={gameState.timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-indigo-500'} />
              <span className={`text-xs font-bold tabular-nums ${gameState.timeLeft <= 3 ? 'text-red-500' : ''}`}>
                {gameState.timeLeft}s
              </span>
            </div>
          )}
        </div>

        {/* The Grid */}
        <div className="flex-1 relative bg-white rounded-2xl border border-black/5 shadow-xl overflow-hidden p-2 grid grid-cols-6 gap-1.5 content-end">
          {/* Grid Background Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
               style={{ 
                 backgroundImage: `linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)`,
                 backgroundSize: `${100/GRID_COLS}% ${100/GRID_ROWS}%`
               }} 
          />

          <AnimatePresence mode="popLayout">
            {gameState.grid.map((block) => (
              <motion.button
                key={block.id}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  y: 0,
                  gridRowStart: GRID_ROWS - block.row,
                  gridColumnStart: block.col + 1
                }}
                exit={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleBlockClick(block.id)}
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-xl font-bold transition-all duration-200
                  ${gameState.selectedIds.includes(block.id) 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105 z-10' 
                    : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-100/50'}
                `}
                style={{
                  gridRow: GRID_ROWS - block.row,
                  gridColumn: block.col + 1
                }}
              >
                {block.value}
              </motion.button>
            ))}
          </AnimatePresence>

          {/* Danger Zone Indicator */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500/20" />
        </div>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {showMenu && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <div className="max-w-sm w-full text-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-12"
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12">
                  <Zap size={40} className="text-emerald-600" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter mb-2">SUMMERGE</h1>
                <p className="text-black/40 font-medium">The ultimate math puzzle challenge</p>
              </motion.div>

              <div className="space-y-4">
                <button 
                  onClick={() => initGame('classic')}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 group"
                >
                  <Play size={20} fill="currentColor" />
                  Classic Mode
                  <ChevronUp size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button 
                  onClick={() => initGame('time')}
                  className="w-full py-4 bg-white border-2 border-black text-black rounded-2xl font-bold text-lg hover:bg-black hover:text-white transition-all flex items-center justify-center gap-3"
                >
                  <Timer size={20} />
                  Time Attack
                </button>
                <button 
                  onClick={() => setShowTutorial(true)}
                  className="w-full py-4 text-black/60 font-bold hover:text-black transition-colors flex items-center justify-center gap-2"
                >
                  <Info size={18} />
                  How to Play
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {gameState.gameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-red-600/95 backdrop-blur-lg z-50 flex items-center justify-center p-6 text-white"
          >
            <div className="max-w-sm w-full text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <h2 className="text-6xl font-black tracking-tighter mb-4">GAME OVER</h2>
                <div className="bg-white/10 rounded-3xl p-8 mb-8 backdrop-blur-sm border border-white/20">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-white/60 font-bold uppercase tracking-widest text-xs">Final Score</span>
                    <span className="text-4xl font-black">{gameState.score}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 font-bold uppercase tracking-widest text-xs">Best Score</span>
                    <span className="text-xl font-bold">{gameState.highScore}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <button 
                    onClick={() => initGame(gameState.mode)}
                    className="w-full py-4 bg-white text-red-600 rounded-2xl font-black text-xl shadow-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-3"
                  >
                    <RotateCcw size={24} />
                    RESTART
                  </button>
                  <button 
                    onClick={() => {
                      setGameState(prev => ({ ...prev, gameOver: false }));
                      setShowMenu(true);
                    }}
                    className="w-full py-4 bg-transparent border-2 border-white/30 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                  >
                    <X size={20} />
                    MAIN MENU
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {isPaused && !gameState.gameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center"
          >
            <button 
              onClick={() => setIsPaused(false)}
              className="bg-white text-black p-8 rounded-full shadow-2xl hover:scale-110 transition-transform"
            >
              <Play size={48} fill="currentColor" />
            </button>
          </motion.div>
        )}

        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-white z-[60] p-8 overflow-y-auto"
          >
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-3xl font-black tracking-tighter">HOW TO PLAY</h2>
                <button onClick={() => setShowTutorial(false)} className="p-2 hover:bg-black/5 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-12">
                <section className="flex gap-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-emerald-600 text-xl">1</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Match the Target</h3>
                    <p className="text-black/60 leading-relaxed">Click on numbers to add them up. Your goal is to reach the exact target sum shown at the top.</p>
                  </div>
                </section>

                <section className="flex gap-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-indigo-600 text-xl">2</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Clear the Board</h3>
                    <p className="text-black/60 leading-relaxed">When you hit the target, the selected blocks disappear. In Classic mode, a new row is added after every match!</p>
                  </div>
                </section>

                <section className="flex gap-6">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-red-600 text-xl">3</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Don't Touch the Top</h3>
                    <p className="text-black/60 leading-relaxed">If the blocks reach the top of the grid, it's game over. Keep clearing them fast!</p>
                  </div>
                </section>

                <section className="flex gap-6">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-amber-600 text-xl">4</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Time Attack</h3>
                    <p className="text-black/60 leading-relaxed">In Time Mode, a new row is added every 10 seconds. You must clear blocks faster than they appear!</p>
                  </div>
                </section>
              </div>

              <button 
                onClick={() => setShowTutorial(false)}
                className="w-full mt-12 py-4 bg-black text-white rounded-2xl font-bold"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Bar (Optional) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-black/5 sm:hidden flex items-center justify-around px-6 z-30">
        <button onClick={() => setShowMenu(true)} className="flex flex-col items-center gap-1 text-black/40 hover:text-black">
          <RotateCcw size={20} />
          <span className="text-[10px] font-bold uppercase">Reset</span>
        </button>
        <button onClick={() => setShowTutorial(true)} className="flex flex-col items-center gap-1 text-black/40 hover:text-black">
          <Info size={20} />
          <span className="text-[10px] font-bold uppercase">Rules</span>
        </button>
        <div className="flex flex-col items-center gap-1 text-indigo-600">
          <Trophy size={20} />
          <span className="text-[10px] font-bold uppercase">Best: {gameState.highScore}</span>
        </div>
      </div>
    </div>
  );
}
