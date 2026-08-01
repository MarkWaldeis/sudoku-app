import React, { createContext, useContext, useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { generateSudoku, generateSudokuSeeded, type Board, type Difficulty } from '../logic/sudokuGenerator';
import { campaignLevels } from '../logic/campaignLevels';
import { findTechniqueHint } from '../logic/sudokuTechniques';
import { getDateKey } from '../logic/dailyChallenge';
import { saveGame, loadGame, loadProfile, saveProfile, sanitizeProfile, type UserProfile, type GameHistoryEntry, defaultProfile } from './storage';

type PencilMarks = { [key: string]: number[] };

/** Upper bound for the undo history so long sessions cannot grow memory unbounded. */
const MAX_HISTORY = 200;

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
  /** Result of the most recent move, used for visual/haptic/mascot feedback. */
  lastMoveResult: { kind: 'correct' | 'wrong'; at: number } | null;
  /** Where this game came from; undefined = classic quick game. */
  gameMode?: 'campaign' | 'quick' | 'extreme' | 'daily' | 'challenge';
  /** Date key ('YYYY-MM-DD') when gameMode === 'daily'. */
  dailyKey?: string;
  /** Seed when gameMode === 'challenge' (or any seeded game). */
  challengeSeed?: number;
}

interface GameContextProps {
  state: GameState;
  /** Solution decoded exactly once per game (memoized) – never recompute per render. */
  solution: Board | null;
  startNewGame: (difficulty: Difficulty, meta?: { mode?: GameState['gameMode']; seed?: number; dailyKey?: string }) => void;
  makeMove: (row: number, col: number, val: number | null) => boolean | null;
  togglePencilMark: (row: number, col: number, val: number) => void;
  undo: () => void;
  redo: () => void;
  checkSolution: () => boolean;
  profile: UserProfile;
  completeLevel: (levelId: number, elapsedTimeSeconds?: number, difficulty?: Difficulty, meta?: { mistakes?: number; dailyKey?: string; challengeSeed?: number }) => { xpGained: number; gemsGained: number; speedBonusGems: number; xpBoosted: boolean; streakFreezeUsed: boolean };
  useHint: (selectedCell?: { r: number; c: number } | null) => { success: boolean; explanation?: string };
  buyShopItem: (itemId: string, cost: number) => boolean;
  selectSkin: (skinId: string) => void;
  refillHearts: () => void;
  updateSettings: (patch: Partial<Pick<UserProfile, 'theme' | 'zenMode' | 'errorHighlight' | 'autoPencilCleanup'>>) => void;
  /** Base64-encoded JSON snapshot of the profile for device-to-device sync. */
  exportSyncCode: () => string;
  /** Replace the profile from a sync code. Returns false on any invalid input. */
  importSyncCode: (code: string) => boolean;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

// Simple obfuscation to prevent plain-text reading in DevTools
const obfuscateSolution = (solution: Board): string[] => {
  return solution.map(row =>
    btoa(row.map(val => (val !== null ? (val * 7).toString() : '')).join('-'))
  );
};

const deobfuscateSolution = (obfuscated: string[]): Board => {
  return obfuscated.map(row =>
    atob(row).split('-').map(val => (val ? parseInt(val) / 7 : null))
  );
};

/** Push a new history entry, dropping the oldest entries beyond MAX_HISTORY. */
const pushHistory = (
  history: { board: Board; pencilMarks: PencilMarks }[],
  historyIndex: number,
  entry: { board: Board; pencilMarks: PencilMarks }
): { history: { board: Board; pencilMarks: PencilMarks }[]; historyIndex: number } => {
  let next = history.slice(0, historyIndex + 1);
  next.push(entry);
  let nextIndex = next.length - 1;
  if (next.length > MAX_HISTORY) {
    next = next.slice(next.length - MAX_HISTORY);
    nextIndex = next.length - 1;
  }
  return { history: next, historyIndex: nextIndex };
};

/** Remove a placed number from all pencil marks in the same row, column and box. */
const cleanupPencilMarks = (marks: PencilMarks, row: number, col: number, val: number): PencilMarks => {
  let changed = false;
  const next: PencilMarks = { ...marks };
  for (let i = 0; i < 9; i++) {
    const cells: [number, number][] = [
      [row, i],
      [i, col],
      [Math.floor(row / 3) * 3 + Math.floor(i / 3), Math.floor(col / 3) * 3 + (i % 3)]
    ];
    for (const [r, c] of cells) {
      if (r === row && c === col) continue;
      const key = `${r}-${c}`;
      const cellMarks = next[key];
      if (cellMarks && cellMarks.includes(val)) {
        next[key] = cellMarks.filter(m => m !== val);
        changed = true;
      }
    }
  }
  return changed ? next : marks;
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState | null>(null);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadGame().then(saved => {
      if (saved) {
        setState(saved as GameState);
      }
    });

    loadProfile().then(savedProfile => {
      setProfile(savedProfile);
    });

    return () => {
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (state) {
      saveGame(state);
    }
  }, [state]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  /**
   * The solution is decoded exactly once per game instead of on every render
   * (previously every cell render re-ran base64 decoding for all 81 cells).
   */
  const solution = useMemo<Board | null>(() => {
    if (!state?.obfuscatedSolution) return null;
    try {
      return deobfuscateSolution(state.obfuscatedSolution);
    } catch {
      return null; // corrupted save data – fail closed, never crash
    }
  }, [state?.obfuscatedSolution]);

  const startNewGame = (difficulty: Difficulty, meta?: { mode?: GameState['gameMode']; seed?: number; dailyKey?: string }) => {
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = null;
    }
    const { puzzle, solution: newSolution } = typeof meta?.seed === 'number'
      ? generateSudokuSeeded(difficulty, meta.seed)
      : generateSudoku(difficulty);
    const newState: GameState = {
      board: puzzle,
      initialBoard: puzzle.map(r => [...r]),
      pencilMarks: {},
      history: [{ board: puzzle, pencilMarks: {} }],
      historyIndex: 0,
      obfuscatedSolution: obfuscateSolution(newSolution),
      lives: 3,
      isGameOver: false,
      comboCount: 0,
      lastMoveTime: null,
      startTime: Date.now(),
      hintedCell: null,
      lastMoveResult: null,
      gameMode: meta?.mode,
      dailyKey: meta?.dailyKey,
      challengeSeed: meta?.seed
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
      const { history, historyIndex } = pushHistory(prev.history, prev.historyIndex, {
        board: newBoard,
        pencilMarks: newPencilMarks
      });
      return {
        ...prev,
        board: newBoard,
        pencilMarks: newPencilMarks,
        history,
        historyIndex
      };
    });
  };

  const makeMove = (row: number, col: number, val: number | null): boolean | null => {
    if (!state || !solution || state.initialBoard[row][col] !== null || state.isGameOver) return null;
    if (state.board[row][col] === val) return null;

    let isCorrect = true;
    if (val !== null && val !== solution[row][col]) {
      isCorrect = false;
    }

    const newBoard = state.board.map(r => [...r]);
    newBoard[row][col] = val;

    // Auto cleanup: a correctly placed number is removed from the pencil
    // marks of its row/column/box (if enabled in the settings).
    const newPencilMarks = (val !== null && isCorrect && profile.autoPencilCleanup)
      ? cleanupPencilMarks(state.pencilMarks, row, col, val)
      : state.pencilMarks;

    setState(prev => {
      if (!prev) return prev;
      const { history, historyIndex } = pushHistory(prev.history, prev.historyIndex, {
        board: newBoard,
        pencilMarks: newPencilMarks
      });

      let newLives = prev.lives;
      let newIsGameOver = prev.isGameOver;
      let newComboCount = prev.comboCount;
      const newLastMoveTime = Date.now();

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
        pencilMarks: newPencilMarks,
        history,
        historyIndex,
        lives: newLives,
        isGameOver: newIsGameOver,
        comboCount: newComboCount,
        lastMoveTime: newLastMoveTime,
        lastMoveResult: val === null ? prev.lastMoveResult : { kind: isCorrect ? 'correct' : 'wrong', at: newLastMoveTime }
      };
    });

    if (val === null) return null;
    return isCorrect;
  };

  const useHint = (selectedCell?: { r: number; c: number } | null): { success: boolean; explanation?: string } => {
    if (!state || !solution || state.isGameOver) return { success: false };

    // Check if player has hints or gems
    const hasFreeHint = profile.hints > 0;
    const hasGems = profile.gems >= 20;

    if (!hasFreeHint && !hasGems) return { success: false };

    // Try to find a teaching hint (technique + explanation) for the current board
    const techniqueHint = findTechniqueHint(state.board);

    // Find target cell
    let targetR = -1;
    let targetC = -1;

    if (selectedCell && state.initialBoard[selectedCell.r][selectedCell.c] === null) {
      if (state.board[selectedCell.r][selectedCell.c] !== solution[selectedCell.r][selectedCell.c]) {
        targetR = selectedCell.r;
        targetC = selectedCell.c;
      }
    }

    if (targetR === -1) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (state.initialBoard[r][c] === null && state.board[r][c] !== solution[r][c]) {
            targetR = r;
            targetC = c;
            break;
          }
        }
        if (targetR !== -1) break;
      }
    }

    if (targetR === -1) return { success: false }; // Board is full/solved

    const correctValue = solution[targetR][targetC]!;
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
      const { history, historyIndex } = pushHistory(prev.history, prev.historyIndex, {
        board: newBoard,
        pencilMarks: prev.pencilMarks
      });
      return {
        ...prev,
        board: newBoard,
        history,
        historyIndex,
        hintedCell: { r: targetR, c: targetC }
      };
    });

    // Clear hint animation highlight after 2.5s (tracked so it can never dangle)
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    hintTimeoutRef.current = setTimeout(() => {
      hintTimeoutRef.current = null;
      setState(prev => prev ? ({ ...prev, hintedCell: null }) : null);
    }, 2500);

    // Attach the explanation only when the technique hint points at (or
    // benefits) the cell that was actually filled.
    const explanation = techniqueHint && techniqueHint.r === targetR && techniqueHint.c === targetC
      ? techniqueHint.explanation
      : undefined;
    return { success: true, explanation };
  };

  const buyShopItem = (itemId: string, cost: number): boolean => {
    if (profile.gems < cost) return false;

    // Extra heart: only meaningful during an active, not-yet-lost game below the cap
    if (itemId === 'extraLife' && (!state || state.isGameOver || state.lives >= 4)) return false;

    setProfile(p => {
      let newHints = p.hints;
      let newStreakFreeze = p.streakFreeze;
      let newXpBoostCharges = p.xpBoostCharges;
      const newUnlockedSkins = [...p.unlockedSkins];

      if (itemId === 'hints') {
        newHints += 3;
      } else if (itemId === 'streakFreeze') {
        newStreakFreeze += 1;
      } else if (itemId === 'xpBoost') {
        newXpBoostCharges += 1;
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
        xpBoostCharges: newXpBoostCharges,
        unlockedSkins: newUnlockedSkins
      };
    });

    if (itemId === 'extraLife') {
      setState(prev => (prev ? { ...prev, lives: Math.min(4, prev.lives + 1) } : prev));
    }

    return true;
  };

  const selectSkin = (skinId: string) => {
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
    if (!state || !solution) return false;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (state.board[r][c] !== solution[r][c]) {
          return false;
        }
      }
    }
    return true;
  };

  const completeLevel = (levelId: number, elapsedTimeSeconds: number = 0, playedDifficulty?: Difficulty, meta?: { mistakes?: number; dailyKey?: string; challengeSeed?: number }) => {
    const levelConfig = campaignLevels.find(l => l.id === levelId);
    // The extreme mode has no campaign entry (level 99), so the difficulty
    // played must be passed in – otherwise extreme runs silently paid easy rewards.
    const difficulty = playedDifficulty ?? levelConfig?.difficulty ?? 'easy';
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

    // A purchased 2x-XP boost doubles this level's XP and is consumed
    const xpBoosted = profile.xpBoostCharges > 0;
    const totalXp = (baseXp + speedBonusXp) * (xpBoosted ? 2 : 1);
    const totalGems = baseGems + speedBonusGems;

    // Compute streak outcome synchronously so the returned flag is reliable
    const today = new Date().toDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const missedDay = profile.lastPlayedDate !== today && profile.lastPlayedDate !== yesterdayDate.toDateString();
    const streakFreezeUsed = missedDay && profile.streak > 0 && profile.streakFreeze > 0;

    // Game history entry for this run (trimmed to the last 200)
    const historyEntry: GameHistoryEntry = {
      date: getDateKey(),
      difficulty,
      timeSeconds: Math.max(0, Math.floor(elapsedTimeSeconds)),
      mistakes: Math.max(0, Math.floor(meta?.mistakes ?? 0)),
      xpGained: totalXp
    };

    setProfile(p => {
      // Nur Kampagnen-Level (1-20) schalten das naechste Level frei;
      // das Extrem-Level (99) darf die Pfad-Progression nicht verfaelschen.
      const newUnlocked =
        levelId >= 1 && levelId <= 20 && !p.unlockedLevels.includes(levelId + 1)
          ? [...p.unlockedLevels, levelId + 1]
          : p.unlockedLevels;

      let newStreak = p.streak;
      let newStreakFreeze = p.streakFreeze;
      if (p.lastPlayedDate !== today) {
        if (p.lastPlayedDate === yesterdayDate.toDateString()) {
          newStreak += 1;
        } else if (p.streak > 0 && p.streakFreeze > 0) {
          // Missed at least one day: a purchased streak freeze saves the streak
          newStreak += 1;
          newStreakFreeze -= 1;
        } else {
          newStreak = 1;
        }
      }

      const newDailyCompleted =
        meta?.dailyKey && !p.dailyCompleted.includes(meta.dailyKey)
          ? [...p.dailyCompleted, meta.dailyKey].slice(-500)
          : p.dailyCompleted;

      return {
        ...p,
        xp: p.xp + totalXp,
        gems: p.gems + totalGems,
        unlockedLevels: newUnlocked,
        streak: newStreak,
        streakFreeze: newStreakFreeze,
        lastPlayedDate: today,
        levelsCompleted: (p.levelsCompleted || 0) + 1,
        xpBoostCharges: xpBoosted ? p.xpBoostCharges - 1 : p.xpBoostCharges,
        dailyCompleted: newDailyCompleted,
        gameHistory: [...p.gameHistory, historyEntry].slice(-200)
      };
    });

    return { xpGained: totalXp, gemsGained: totalGems, speedBonusGems, xpBoosted, streakFreezeUsed };
  };

  const updateSettings = (patch: Partial<Pick<UserProfile, 'theme' | 'zenMode' | 'errorHighlight' | 'autoPencilCleanup'>>) => {
    setProfile(p => ({ ...p, ...patch }));
  };

  const exportSyncCode = (): string => {
    // Unicode-safe base64: percent-encode first, then map bytes to chars
    const json = JSON.stringify(profile);
    const encoded = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
    return btoa(encoded);
  };

  const importSyncCode = (code: string): boolean => {
    try {
      const binary = atob(code.trim());
      const escaped = Array.from(binary, ch => '%' + ch.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      const parsed: unknown = JSON.parse(decodeURIComponent(escaped));
      setProfile(sanitizeProfile(parsed));
      return true;
    } catch {
      return false; // invalid code – never throw
    }
  };

  const contextValue = useMemo(() => ({
    state: state!,
    solution,
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
    refillHearts,
    updateSettings,
    exportSyncCode,
    importSyncCode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [state, solution, profile]);

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
