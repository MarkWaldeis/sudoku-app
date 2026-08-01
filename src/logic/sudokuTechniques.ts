import type { Board } from './sudokuGenerator';

export interface TechniqueHint {
  r: number;
  c: number;
  value: number;
  technique: string;
  explanation: string;
}

type Cell = [number, number];

/** Candidates of an empty cell, derived from row/column/box (pencil marks are ignored). */
const candidatesFor = (board: Board, r: number, c: number): number[] => {
  const used = new Set<number>();
  for (let i = 0; i < 9; i++) {
    const rowVal = board[r][i];
    const colVal = board[i][c];
    const boxVal = board[Math.floor(r / 3) * 3 + Math.floor(i / 3)][Math.floor(c / 3) * 3 + (i % 3)];
    if (rowVal !== null) used.add(rowVal);
    if (colVal !== null) used.add(colVal);
    if (boxVal !== null) used.add(boxVal);
  }
  const result: number[] = [];
  for (let n = 1; n <= 9; n++) {
    if (!used.has(n)) result.push(n);
  }
  return result;
};

/** All 27 units (9 rows, 9 columns, 9 boxes) as cell lists. */
const buildUnits = (): { label: (r: number, c: number) => string; cells: Cell[] }[] => {
  const units: { label: (r: number, c: number) => string; cells: Cell[] }[] = [];
  for (let r = 0; r < 9; r++) {
    const cells: Cell[] = [];
    for (let c = 0; c < 9; c++) cells.push([r, c]);
    units.push({ label: () => `Zeile ${r + 1}`, cells });
  }
  for (let c = 0; c < 9; c++) {
    const cells: Cell[] = [];
    for (let r = 0; r < 9; r++) cells.push([r, c]);
    units.push({ label: () => `Spalte ${c + 1}`, cells });
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const cells: Cell[] = [];
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) cells.push([r, c]);
      }
      units.push({
        label: () => `dem 3x3-Block ab Zeile ${br * 3 + 1}, Spalte ${bc * 3 + 1}`,
        cells
      });
    }
  }
  return units;
};

const samePair = (a: number[], b: number[]): boolean =>
  a.length === 2 && b.length === 2 && a[0] === b[0] && a[1] === b[1];

/**
 * Find one teaching hint for the current board, searching in this order:
 * 1. Naked Single  – a cell with exactly one candidate
 * 2. Hidden Single – a candidate that fits in only one cell of a unit
 * 3. Naked Pair    – two cells in a unit share the same candidate pair,
 *    which reduces another cell of that unit to a single candidate
 *    (the profiting cell is returned)
 * Returns null if none applies.
 */
export const findTechniqueHint = (board: Board): TechniqueHint | null => {
  // Candidate grid: empty for filled cells
  const cand: number[][][] = Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => (board[r][c] === null ? candidatesFor(board, r, c) : []))
  );

  // (a) Naked Single
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === null && cand[r][c].length === 1) {
        const value = cand[r][c][0];
        return {
          r, c, value,
          technique: 'Naked Single',
          explanation: `In Zeile ${r + 1}, Spalte ${c + 1} ist nur die ${value} möglich – alle anderen Zahlen stehen bereits in dieser Zeile, Spalte oder diesem Block.`
        };
      }
    }
  }

  const units = buildUnits();

  // (b) Hidden Single
  for (const unit of units) {
    for (let n = 1; n <= 9; n++) {
      const spots = unit.cells.filter(([r, c]) => board[r][c] === null && cand[r][c].includes(n));
      if (spots.length === 1) {
        const [r, c] = spots[0];
        return {
          r, c, value: n,
          technique: 'Hidden Single',
          explanation: `In ${unit.label(r, c)} kann die ${n} nur an einer Stelle stehen: Zeile ${r + 1}, Spalte ${c + 1} – deshalb gehört sie hierher.`
        };
      }
    }
  }

  // (c) Naked Pair -> the pair eliminates candidates elsewhere, creating a Naked Single
  for (const unit of units) {
    const pairCells = unit.cells.filter(([r, c]) => board[r][c] === null && cand[r][c].length === 2);
    for (let i = 0; i < pairCells.length; i++) {
      for (let j = i + 1; j < pairCells.length; j++) {
        const [r1, c1] = pairCells[i];
        const [r2, c2] = pairCells[j];
        if (!samePair(cand[r1][c1], cand[r2][c2])) continue;
        const pair = cand[r1][c1];
        for (const [r, c] of unit.cells) {
          if ((r === r1 && c === c1) || (r === r2 && c === c2)) continue;
          if (board[r][c] !== null) continue;
          const remaining = cand[r][c].filter(n => !pair.includes(n));
          if (remaining.length === 1 && remaining.length < cand[r][c].length) {
            return {
              r, c, value: remaining[0],
              technique: 'Naked Pair',
              explanation: `Die Zellen Zeile ${r1 + 1}/Spalte ${c1 + 1} und Zeile ${r2 + 1}/Spalte ${c2 + 1} teilen sich das Paar ${pair[0]} und ${pair[1]} – diese beiden Zahlen kommen sonst nirgends in dieser Einheit vor. Dadurch bleibt in Zeile ${r + 1}, Spalte ${c + 1} nur die ${remaining[0]} übrig.`
            };
          }
        }
      }
    }
  }

  return null;
};
