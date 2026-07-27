import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { generateSudoku, type Board, type Difficulty } from '../logic/sudokuGenerator';
import { campaignLevels } from '../logic/campaignLevels';
import { saveGame, loadGame, loadProfile, saveProfile, type UserProfile, defaultProfile } from './storage';

type PencilMarks = { [key: string]: number[] };

interface GameState {
  board: Board;
  initialBoard: Board;
  pencilMarks: PencilMarks;
  history: { board: Board; pencilMarks: PencilMarks }[];
  historyIndex: number;
  obfuscatedSolution: string[]; // Anti-cheat: solution row by row obfuscated
  lives: number;
  isGameOver: boolean;
  comboCount: number;
  lastMoveTime: number | null;
  startTime: number;
  hintedCell: { r: number; c: number } | null;
}

interface GameContextProps {
  state: GameState;
  startNewGame: (difficulty: Difficulty) => void;
  makeMove: (row: number, col: number, val: number | null) => boolean | null;
  togglePencilMark: (row: number, col: number, val: number) => void;
  undo: () => void;
  redo: () => void;
  checkSolution: () => boolean;
  profile: UserProfile;
  completeLevel: (levelId: number, elapsedTimeSeconds?: number) => { xpGained: number; gemsGained: number; speedBonusGems: number };
  useHint: (selectedCell?: { r: number; c: number } | null) => boolean;
  buyShopItem: (itemId: string, cost: number) => boolean;
  selectSkin: (skinId: 'default' | 'fox' | 'king' | 'ninja') => void;
  refillHearts: () => void;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

// Simple obfuscation to prevent plain-text reading in DevTools
const obfuscateSolution = (solution: Board): string[] => {
  return solution.map(row => 
    btoa(row.map(val => (val !== null ? (val * 7).toString() : '')).join('-'))
  );
};

export const deobfuscateSolution = (obfuscated: string[]): Board => {
  return obfuscated.map(row => 
    atob(row).split('-').map(val => (val ? parseInt(val) / 7 : null))
  );
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState | null>(null);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  useEffect(() => {
    loadGame().then(saved => {
      if (saved) {
        setState(saved as GameState);
      }
    });
    
    loadProfile().then(savedProfile => {
      setProfile(savedProfile);
    });
  }, []);

  useEffect(() => {
    if (state) {
      saveGame(state);
    }
  }, [state]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  const startNewGame = (difficulty: Difficulty) => {
    const { puzzle, solution } = generateSudoku(difficulty);
    const newState: GameState = {
      board: puzzle,
      initialBoard: puzzle.map(r => [...r]),
      pencilMarks: {},
      history: [{ board: puzzle, pencilMarks: {} }],
      historyIndex: 0,
      obfuscatedSolution: obfuscateSolution(solution),
      lives: 3,
      isGameOver: false,
      comboCount: 0,
      lastMoveTime: null,
      startTime: Date.now(),
      hintedCell: null
    };
    setState(newState);
    setProfile(p => ({
      ...p,
      totalGamesPlayed: (p.totalGamesPlayed || 0) + 1
    }));
  };

  const updateStateAndHistory = (newBoard: Board, newPencilMarks: PencilMarks) => {
    setState(prev => {
      if (!prev) return prev;
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({ board: newBoard, pencilMarks: newPencilMarks });
      return {
        ...prev,
        board: newBoard,
        pencilMarks: newPencilMarks,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  };

  const makeMove = (row: number, col: number, val: number | null): boolean | null => {
    if (!state || state.initialBoard[row][col] !== null || state.isGameOver) return null;
    if (state.board[row][col] === val) return null;

    let isCorrect = true;
    if (val !== null) {
      const realSolution = deobfuscateSolution(state.obfuscatedSolution);
      if (val !== realSolution[row][col]) {
        isCorrect = false;
      }
    }

    const newBoard = state.board.map(r => [...r]);
    newBoard[row][col] = val;

    setState(prev => {
      if (!prev) return prev;
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({ board: newBoard, pencilMarks: prev.pencilMarks });
      
      let newLives = prev.lives;
      let newIsGameOver = prev.isGameOver;
      let newComboCount = prev.comboCount;
      let newLastMoveTime = Date.now();

      if (val !== null) {
        if (!isCorrect) {
          newLives -= 1;
          newComboCount = 0;
          if (newLives <= 0) {
            newIsGameOver = true;
          }
          setProfile(p => ({ ...p, incorrectMoves: (p.incorrectMoves || 0) + 1 }));
        } else {
          const timeSinceLast = prev.lastMoveTime ? newLastMoveTime - prev.lastMoveTime : 10000;
          if (timeSinceLast < 5000) {
            newComboCount += 1;
          } else {
            newComboCount = 1;
          }
          
          const xpGained = 10 + (newComboCount > 1 ? 5 : 0);
          setProfile(p => ({ 
            ...p, 
            xp: p.xp + xpGained,
            gems: p.gems + 1, // 1 gem per correct move
            correctMoves: (p.correctMoves || 0) + 1
          }));
        }
      }

      return {
        ...prev,
        board: newBoard,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        lives: newLives,
        isGameOver: newIsGameOver,
        comboCount: newComboCount,
        lastMoveTime: newLastMoveTime
      };
    });

    if (val === null) return null;
    return isCorrect;
  };

  const useHint = (selectedCell?: { r: number; c: number } | null): boolean => {
    if (!state || state.isGameOver) return false;

    // Check if player has hints or gems
    const hasFreeHint = profile.hints > 0;
    const hasGems = profile.gems >= 20;

    if (!hasFreeHint && !hasGems) return false;

    const realSolution = deobfuscateSolution(state.obfuscatedSolution);

    // Find target cell
    let targetR = -1;
    let targetC = -1;

    if (selectedCell && state.initialBoard[selectedCell.r][selectedCell.c] === null) {
      if (state.board[selectedCell.r][selectedCell.c] !== realSolution[selectedCell.r][selectedCell.c]) {
        targetR = selectedCell.r;
        targetC = selectedCell.c;
      }
    }

    if (targetR === -1) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (state.initialBoard[r][c] === null && state.board[r][c] !== realSolution[r][c]) {
            targetR = r;
            targetC = c;
            break;
          }
        }
        if (targetR !== -1) break;
      }
    }

    if (targetR === -1) return false; // Board is full/solved

    const correctValue = realSolution[targetR][targetC]!;
    const newBoard = state.board.map(r => [...r]);
    newBoard[targetR][targetC] = correctValue;

    // Consume hint or gems
    setProfile(p => ({
      ...p,
      hints: hasFreeHint ? p.hints - 1 : p.hints,
      gems: !hasFreeHint ? p.gems - 20 : p.gems
    }));

    setState(prev => {
      if (!prev) return prev;
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({ board: newBoard, pencilMarks: prev.pencilMarks });
      return {
        ...prev,
        board: newBoard,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        hintedCell: { r: targetR, c: targetC }
      };
    });

    // Clear hint animation highlight after 2.5s
    setTimeout(() => {
      setState(prev => prev ? ({ ...prev, hintedCell: null }) : null);
    }, 2500);

    return true;
  };

  const buyShopItem = (itemId: string, cost: number): boolean => {
    if (profile.gems < cost) return false;

    setProfile(p => {
      let newHints = p.hints;
      let newStreakFreeze = p.streakFreeze;
      let newUnlockedSkins = [...p.unlockedSkins];

      if (itemId === 'hints') {
        newHints += 3;
      } else if (itemId === 'streakFreeze') {
        newStreakFreeze += 1;
      } else if (itemId.startsWith('skin_')) {
        const skinId = itemId.replace('skin_', '');
        if (!newUnlockedSkins.includes(skinId)) {
          newUnlockedSkins.push(skinId);
        }
      }

      return {
        ...p,
        gems: p.gems - cost,
        hints: newHints,
        streakFreeze: newStreakFreeze,
        unlockedSkins: newUnlockedSkins
      };
    });

    return true;
  };

  const selectSkin = (skinId: 'default' | 'fox' | 'king' | 'ninja') => {
    setProfile(p => ({
      ...p,
      selectedMascotSkin: skinId
    }));
  };

  const refillHearts = () => {
    setState(prev => prev ? ({ ...prev, lives: 3, isGameOver: false }) : null);
  };

  const togglePencilMark = (row: number, col: number, val: number) => {
    if (!state || state.board[row][col] !== null) return;
    const key = `${row}-${col}`;
    const newPencilMarks = { ...state.pencilMarks };
    const marks = newPencilMarks[key] || [];
    
    if (marks.includes(val)) {
      newPencilMarks[key] = marks.filter(m => m !== val);
    } else {
      newPencilMarks[key] = [...marks, val];
    }
    updateStateAndHistory(state.board, newPencilMarks);
  };

  const undo = () => {
    setState(prev => {
      if (!prev || prev.historyIndex === 0) return prev;
      const newIndex = prev.historyIndex - 1;
      const pastState = prev.history[newIndex];
      return {
        ...prev,
        board: pastState.board,
        pencilMarks: pastState.pencilMarks,
        historyIndex: newIndex
      };
    });
  };

  const redo = () => {
    setState(prev => {
      if (!prev || prev.historyIndex === prev.history.length - 1) return prev;
      const newIndex = prev.historyIndex + 1;
      const nextState = prev.history[newIndex];
      return {
        ...prev,
        board: nextState.board,
        pencilMarks: nextState.pencilMarks,
        historyIndex: newIndex
      };
    });
  };

  const checkSolution = () => {
    if (!state) return false;
    const realSolution = deobfuscateSolution(state.obfuscatedSolution);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (state.board[r][c] !== realSolution[r][c]) {
          return false;
        }
      }
    }
    return true;
  };

  const completeLevel = (levelId: number, elapsedTimeSeconds: number = 0) => {
    const levelConfig = campaignLevels.find(l => l.id === levelId);
    const difficulty = levelConfig?.difficulty || 'easy';
    let baseXp = levelConfig ? levelConfig.xpReward : 100;
    let baseGems = 25;

    if (difficulty === 'extreme') {
      baseXp = 2500;
      baseGems = 250;
    }

    // Speed bonus calculation
    let speedBonusGems = 0;
    let speedBonusXp = 0;

    if (elapsedTimeSeconds > 0) {
      if (difficulty === 'easy' && elapsedTimeSeconds <= 180) { // < 3 mins
        speedBonusGems = 50;
        speedBonusXp = 50;
      } else if (difficulty === 'medium' && elapsedTimeSeconds <= 300) { // < 5 mins
        speedBonusGems = 100;
        speedBonusXp = 100;
      } else if (difficulty === 'hard' && elapsedTimeSeconds <= 480) { // < 8 mins
        speedBonusGems = 200;
        speedBonusXp = 250;
      } else if (difficulty === 'extreme' && elapsedTimeSeconds <= 900) { // < 15 mins
        speedBonusGems = 500;
        speedBonusXp = 1000;
      }
    }

    const totalXp = baseXp + speedBonusXp;
    const totalGems = baseGems + speedBonusGems;

    setProfile(p => {
      const newUnlocked = p.unlockedLevels.includes(levelId + 1) 
        ? p.unlockedLevels 
        : [...p.unlockedLevels, levelId + 1];

      const today = new Date().toDateString();
      let newStreak = p.streak;
      if (p.lastPlayedDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (p.lastPlayedDate === yesterday.toDateString()) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }

      return {
        ...p,
        xp: p.xp + totalXp,
        gems: p.gems + totalGems,
        unlockedLevels: newUnlocked,
        streak: newStreak,
        lastPlayedDate: today
      };
    });

    return { xpGained: totalXp, gemsGained: totalGems, speedBonusGems };
  };

  const contextValue = useMemo(() => ({
    state: state!,
    startNewGame,
    makeMove,
    togglePencilMark,
    undo,
    redo,
    checkSolution,
    profile,
    completeLevel,
    useHint,
    buyShopItem,
    selectSkin,
    refillHearts
  }), [state, profile]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
