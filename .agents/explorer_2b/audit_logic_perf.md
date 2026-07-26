# In-Depth Audit Report: Game Logic & Performance (Perspectives 2 & 5)

**Project:** `sudoku-app`  
**Auditor:** Explorer 2B  
**Date:** 2026-07-26  

---

## Executive Summary

An in-depth technical audit of **Game Logic** (Perspective 2) and **Performance** (Perspective 5) was conducted across `src/logic/`, `src/store/`, `src/services/`, `src/utils/`, `src/components/`, `vite.config.ts`, and project build output. 

While the application provides a functional Duolingo-styled Sudoku experience, critical architectural flaws, logic shortcomings, and performance bottlenecks were identified. Key concerns include:
- **Game Logic**: Greedy cell removal in puzzle generation failing to achieve target difficulty clue counts, array allocation and biased sorting (`Math.random() - 0.5`) in backtracking recursion, unbounded history stacks stored in persistence, missing auto-cleaning of pencil marks, notes mode keyboard bug, and weak obfuscation.
- **Performance**: A monolithic **381.80 kB** production bundle without chunk splitting or dynamic imports, missing React memoization resulting in all 81 Framer Motion cell nodes re-rendering on every selection, unmemoized context providers re-creating function references on every state change, un-disconnected Web Audio API nodes leaking memory, and un-debounced IndexedDB writes serializing full state history stacks on every single move.

---

## Part 1: Perspective 2 — Game Logic Audit

### 1. Backtracking Generator Speed, Correctness & Uniqueness Guarantees (`src/logic/sudokuGenerator.ts`)
- **Biased Array Shuffling in Recursive Backtracking**:
  - `solve()` uses `[1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5)` on **every empty cell visit**.
  - `Math.random() - 0.5` is a mathematically biased shuffle algorithm with non-uniform distribution.
  - Creating and sorting a new 9-element array at every recursive node creates significant Garbage Collection (GC) pressure during backtracking.
- **Greedy Cell Removal & Unreachable Clue Targets**:
  - `generateSudoku()` uses a single linear loop over shuffled cell coordinates (`positions`) to remove clues (`cellsToRemove`: Easy = 30, Medium = 45, Hard = 60).
  - When `difficulty === 'hard'`, removing 60 cells leaves 21 clues. However, because clue removal is purely greedy (without backtracking removal when uniqueness fails), after removing ~35–40 cells, almost every subsequent candidate removal breaks uniqueness (`countSolutions > 1`).
  - As a result, the loop terminates having removed only ~35–40 cells instead of 60. **Hard puzzles generated are frequently no harder than Medium puzzles.**
- **Uniqueness Check Correctness & Main Thread Freeze Risk**:
  - `countSolutions(board, 2)` correctly identifies non-unique puzzles.
  - However, `countSolutions` lacks a recursion step counter or timeout safeguard. On complex sparse boards, solver backtracking can perform millions of operations synchronously, locking up the main UI thread.

### 2. Campaign Levels & Difficulty Scaling (`src/logic/campaignLevels.ts`)
- **Lack of Seeded / Procedural Technique Progression**:
  - `campaignLevels.ts` maps Levels 1 to 20 to difficulty strings (`'easy'`, `'medium'`, `'hard'`).
  - There are no fixed level seeds, no logical technique evaluations (e.g. Naked/Hidden Singles, Pairs, X-Wing), and no granular clue count targets (e.g. Level 1 = 45 clues, Level 4 = 38 clues).
  - Level 1 and Level 4 both trigger `generateSudoku('easy')`, producing randomly generated puzzles of identical difficulty range. Replaying Level 1 produces a different puzzle every time.

### 3. Candidate / Pencil Mark Logic (`src/store/GameContext.tsx` & `src/components/ui/SudokuBoard.tsx`)
- **No Automatic Candidate Cleanup**:
  - When a correct digit $N$ is placed in cell $(r, c)$, candidate pencil marks for $N$ in row $r$, column $c$, or the 3x3 box are **not** automatically removed.
  - Candidate entries in `${r}-${c}` remain stored in state even after a final number is filled.
- **Notes Mode Keyboard Backspace Bug**:
  - In `SudokuBoard.tsx` (line 40):
    ```ts
    else if (e.key === 'Backspace' || e.key === 'Delete') {
      if (selectedCell && !isNotesMode) {
        makeMove(selectedCell.r, selectedCell.c, null);
      }
    }
    ```
    When `isNotesMode` is active, pressing `Backspace` or `Delete` is blocked by `!isNotesMode`, preventing users from clearing cell values while in notes mode.

### 4. Undo / Redo State & History Management (`src/store/GameContext.tsx`)
- **Unbounded State Stack & Double Persistence Penalty**:
  - `history` pushes `{ board, pencilMarks }` on every move and candidate toggle.
  - There is no upper limit (e.g., max 50 states). Long sessions generate large arrays of full 9x9 board snapshots.
  - `useEffect(() => { saveGame(state); }, [state])` serializes the **entire state object including full history array** to IndexedDB on every single move or note toggle.

### 5. Solution Validation & Anti-Cheat Obfuscation (`src/store/GameContext.tsx`)
- **Weak Client-Side Obfuscation**:
  - Solution obfuscation converts numbers: `val * 7`, joins with `-`, and Base64 encodes (`btoa`).
  - This is easily decoded via DevTools (`deobfuscateSolution(state.obfuscatedSolution)`).
  - `deobfuscateSolution` is executed on **every render** of `SudokuBoard` (line 55) and on every move verification, causing redundant string splitting and parsing.

### 6. Localforage Persistence & Schema Migration (`src/store/storage.ts`)
- **Unthrottled Writes & Missing Migration**:
  - Save operations (`saveGame`, `saveProfile`) are un-debounced.
  - No schema versioning exists. If `UserProfile` or `GameState` structure evolves, `loadProfile()` returns incomplete structures without defaults for new properties, leading to `undefined` errors.
  - Storage failures in restricted browser environments fail silently with `console.error` without falling back to `localStorage`.

---

## Part 2: Perspective 5 — Performance Audit

### 1. Vite Build Output & Bundle Bottlenecks (`vite.config.ts`, `package.json`)
- **Monolithic Bundle Output**:
  - Production build produces a single JS bundle: `dist/assets/index-DTy-N9RV.js` at **381.80 kB** (120.95 kB gzipped).
  - `framer-motion` (~120 kB), `canvas-confetti`, `localforage`, and `react-icons` are all packed into the initial load bundle without manual chunking or code splitting.
  - Modals (`StatsModal`, `LeaderboardModal`) are imported statically in `App.tsx` instead of using `React.lazy()` dynamic imports.

### 2. React Component Re-render Optimization
- **Unmemoized `GameContext.Provider` Value**:
  - `GameContext.Provider` passes an inline object: `value={{ state: state!, startNewGame, makeMove, togglePencilMark, undo, redo, checkSolution, profile, completeLevel }}`.
  - None of these functions are wrapped in `useCallback`.
  - Every state change creates a new context reference, forcing **all consumer components** (`SudokuBoard`, `HeaderStats`, `App`, `StatsModal`, `LeaderboardModal`) to re-render completely.
- **Unmemoized Sudoku Board Grid (81 Nodes)**:
  - `SudokuBoard.tsx` maps 81 cells inline inside the component body.
  - No cell component is wrapped in `React.memo`.
  - Each cell renders a Framer Motion `<motion.div>` with inline dynamic animation objects (`animate={{ backgroundColor: ... }}`).
  - Selecting a single cell or placing a number re-evaluates framer-motion props across all 81 DOM nodes.

### 3. Web Audio API Synthesizer Resource Usage (`src/utils/soundEffects.ts`)
- **Audio Node Memory Retention**:
  - `playOscillator` creates `OscillatorNode` and `GainNode`, starts and stops the oscillator, but **never disconnects** `oscillator` or `gainNode`, nor listens to `onended`.
  - In Web Audio API, connected nodes without `disconnect()` calls retain references in audio processing threads, causing accumulating memory retention.
- **Orphaned `setTimeout` Timers**:
  - Multi-tone chimes (`playSuccessChime`, `playVictoryFanfare`) trigger delayed notes via `setTimeout`. Rapid user interactions leave orphaned timers running in background.

### 4. Localforage Async I/O Efficiency (`src/store/storage.ts` & `src/GameContext.tsx`)
- **Heavy IndexedDB Serialization on Every Action**:
  - Every move triggers `saveGame(state)` immediately without debouncing (e.g., 300–500ms debounce).
  - Serializing deep objects with unbounded history stacks over IndexedDB blocks the event loop and increases main-thread Garbage Collection pauses.

---

## Part 3: Prioritized Weaknesses

| Priority | Category | Issue Summary | Impact |
| :--- | :--- | :--- | :--- |
| **HIGH** | Performance / React | `GameContext.Provider` passes unmemoized inline value object & functions | Causes total application tree re-render on every state change or timer tick |
| **HIGH** | Performance / React | 81 unmemoized `<motion.div>` cells in `SudokuBoard` with inline framer-motion props | Severe UI stutter/lag on cell selection and number entry on mobile devices |
| **HIGH** | Game Logic / Perf | Unbounded history stack saved to `localforage` synchronously on every move | Massive IndexedDB write payloads (MBs over long games), causing main-thread I/O delays |
| **HIGH** | Game Logic | Greedy cell removal in `sudokuGenerator.ts` fails to reach requested 60 clue removals | Hard difficulty puzzles are no harder than Medium difficulty puzzles |
| **MEDIUM** | Performance / Build | Single monolithic JS bundle (381.80 kB) with no vendor chunk splitting | Slow initial page load time and poor web vitals (LCP/TBT) |
| **MEDIUM** | Performance / Audio | Web Audio API nodes (`OscillatorNode`, `GainNode`) never disconnected after playback | Audio thread node accumulation and potential memory leak |
| **MEDIUM** | Game Logic | `solve()` allocates and sorts `[1..9]` array with `Math.random() - 0.5` at every backtracking step | Heavy GC pressure and non-uniform biased puzzle generation |
| **MEDIUM** | Game Logic / UI | Notes mode blocks `Backspace`/`Delete` key execution in `SudokuBoard.tsx` | Prevents clearing filled cells while notes mode is toggled |
| **LOW** | Game Logic | Lack of candidate auto-cleaning when numbers are placed | Minor UX inconvenience requiring manual pencil mark removal |
| **LOW** | Persistence | Missing schema versioning and silent storage error handling in `storage.ts` | Potential data corruption on future profile schema changes |

---

## Part 4: Concrete Recommendations

### 1. Game Logic Recommendations
1. **Optimize Backtracking & Generator**:
   - Replace `[1..9].sort(() => Math.random() - 0.5)` in `solve()` with a pre-allocated array and a standard **Fisher-Yates shuffle** algorithm.
   - Implement backtracking or multi-pass pattern removal for Hard difficulty generation to reliably reach target clue counts (e.g. 24–28 clues).
   - Add a step counter / recursion limit in `countSolutions` to prevent main-thread hangs.
2. **Fix History Stack & Storage Throttling**:
   - Cap `history` stack at a maximum of 50 steps.
   - Separate transient UI state from saved state; do not persist full history stacks to `localforage`.
   - Implement a 500ms `debounce` for `saveGame` and `saveProfile` calls.
3. **Fix Candidate & Keyboard Logic**:
   - Automatically strip placed number $N$ from pencil marks in corresponding row, column, and box.
   - Fix `SudokuBoard.tsx` keyboard listener so `Backspace`/`Delete` clears cell values regardless of `isNotesMode`.

### 2. Performance Recommendations
1. **Memoize Context Value & Functions**:
   - Wrap `startNewGame`, `makeMove`, `togglePencilMark`, `undo`, `redo`, `checkSolution`, `completeLevel` in `useCallback`.
   - Wrap the `GameContext.Provider` value in `useMemo(..., [state, profile])`.
2. **Extract & Memoize Grid Cell Component**:
   - Create a dedicated `SudokuCell` component wrapped in `React.memo` with custom `arePropsEqual` comparison.
   - Memoize `deobfuscateSolution` using `useMemo` in `SudokuBoard`.
3. **Clean Up Web Audio Nodes**:
   - In `soundEffects.ts`, attach `oscillator.onended = () => { oscillator.disconnect(); gainNode.disconnect(); };`.
   - Track active audio timeout IDs to clear pending timeouts on unmount or reset.
4. **Vite Code Splitting & Optimization**:
   - Configure `vite.config.ts` `build.rollupOptions.output.manualChunks` to split `vendor-react`, `vendor-framer`, `vendor-utils`.
   - Use `React.lazy()` for `StatsModal` and `LeaderboardModal`.
