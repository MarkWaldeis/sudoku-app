export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export const EXTREME_PUZZLE: Board = [
  [1, null, null, null, null, 7, null, 9, null],
  [null, 3, null, null, 2, null, null, null, 8],
  [null, null, 9, 6, null, null, 5, null, null],
  [null, null, 5, 3, null, null, 9, null, null],
  [null, 1, null, null, 8, null, null, null, 2],
  [6, null, null, null, null, 4, null, null, null],
  [3, null, null, null, null, null, null, 1, null],
  [null, 4, null, null, null, null, null, null, 7],
  [null, null, 7, null, null, null, 3, null, null]
];

export const EXTREME_SOLUTION: Board = [
  [1, 6, 2, 8, 5, 7, 4, 9, 3],
  [5, 3, 4, 1, 2, 9, 6, 7, 8],
  [7, 8, 9, 6, 4, 3, 5, 2, 1],
  [4, 7, 5, 3, 1, 2, 9, 8, 6],
  [9, 1, 3, 5, 8, 6, 7, 4, 2],
  [6, 2, 8, 7, 9, 4, 1, 3, 5],
  [3, 5, 6, 4, 7, 8, 2, 1, 9],
  [2, 4, 1, 9, 3, 5, 8, 6, 7],
  [8, 9, 7, 2, 6, 1, 3, 5, 4]
];
export type Board = (number | null)[][];

const BLANK: null = null;

export const createEmptyBoard = (): Board => {
  return Array.from({ length: 9 }, () => Array(9).fill(BLANK));
};

const isValid = (board: Board, row: number, col: number, num: number): boolean => {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
    const boxRow = Math.floor(row / 3) * 3 + Math.floor(i / 3);
    const boxCol = Math.floor(col / 3) * 3 + (i % 3);
    if (board[boxRow][boxCol] === num) return false;
  }
  return true;
};

const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const solve = (board: Board): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === BLANK) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solve(board)) return true;
            board[row][col] = BLANK;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const countSolutions = (board: Board, limit: number = 2): number => {
  let count = 0;
  const solveAndCount = (b: Board) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (b[row][col] === BLANK) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(b, row, col, num)) {
              b[row][col] = num;
              solveAndCount(b);
              if (count >= limit) {
                b[row][col] = BLANK;
                return;
              }
              b[row][col] = BLANK;
            }
          }
          return;
        }
      }
    }
    count++;
  };
  solveAndCount(board);
  return count;
};

export const generateSudoku = (difficulty: Difficulty): { puzzle: Board; solution: Board } => {
  if (difficulty === 'extreme' && Math.random() < 0.5) {
    return {
      puzzle: EXTREME_PUZZLE.map(row => [...row]),
      solution: EXTREME_SOLUTION.map(row => [...row])
    };
  }

  const solution = createEmptyBoard();
  solve(solution);

  const puzzle = solution.map(row => [...row]);
  let cellsToRemove = 0;
  
  switch (difficulty) {
    case 'easy': cellsToRemove = 30; break;
    case 'medium': cellsToRemove = 45; break;
    case 'hard': cellsToRemove = 60; break;
    case 'extreme': cellsToRemove = 64; break;
  }

  const rawPositions = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      rawPositions.push([r, c]);
    }
  }
  const positions = shuffle(rawPositions);

  for (const [r, c] of positions) {
    if (cellsToRemove <= 0) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = BLANK;
    
    // Check if unique solution exists
    const puzzleCopy = puzzle.map(row => [...row]);
    if (countSolutions(puzzleCopy, 2) !== 1) {
      puzzle[r][c] = backup; // revert
    } else {
      cellsToRemove--;
    }
  }

  return { puzzle, solution };
};
