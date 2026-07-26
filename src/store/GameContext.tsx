import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { generateSudoku, type Board, type Difficulty } from '../logic/sudokuGenerator';
import { saveGame, loadGame } from './storage';

type PencilMarks = { [key: string]: number[] };

interface GameState {
  board: Board;
  initialBoard: Board;
  pencilMarks: PencilMarks;
  history: { board: Board; pencilMarks: PencilMarks }[];
  historyIndex: number;
  obfuscatedSolution: string[]; // Anti-cheat: solution row by row obfuscated
}

interface GameContextProps {
  state: GameState;
  startNewGame: (difficulty: Difficulty) => void;
  makeMove: (row: number, col: number, val: number | null) => void;
  togglePencilMark: (row: number, col: number, val: number) => void;
  undo: () => void;
  redo: () => void;
  checkSolution: () => boolean;
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

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    loadGame().then(saved => {
      if (saved) {
        setState(saved as GameState);
      }
    });
  }, []);

  useEffect(() => {
    if (state) {
      saveGame(state);
    }
  }, [state]);

  const startNewGame = (difficulty: Difficulty) => {
    const { puzzle, solution } = generateSudoku(difficulty);
    const newState: GameState = {
      board: puzzle,
      initialBoard: puzzle.map(r => [...r]),
      pencilMarks: {},
      history: [{ board: puzzle, pencilMarks: {} }],
      historyIndex: 0,
      obfuscatedSolution: obfuscateSolution(solution),
    };
    setState(newState);
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

  const makeMove = (row: number, col: number, val: number | null) => {
    if (!state || state.initialBoard[row][col] !== null) return; // Prevent overwriting initial puzzle clues
    const newBoard = state.board.map(r => [...r]);
    newBoard[row][col] = val;
    updateStateAndHistory(newBoard, state.pencilMarks);
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

  return (
    <GameContext.Provider value={{ state: state!, startNewGame, makeMove, togglePencilMark, undo, redo, checkSolution }}>
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
