# Handoff Report — Explorer 2B (Game Logic & Performance Audit)

**Agent:** Explorer 2B  
**Directory:** `C:\Users\Mark Waldeis\Desktop\sudoku-app\.agents\explorer_2b`  
**Date:** 2026-07-26  

---

## 1. Observation

Direct code observations from inspection of `src/` and project build output:

1. **Vite Build Bundle Size (`vite.config.ts` & build execution)**:
   - Command: `npm run build`
   - Output:
     `dist/assets/index-DMzAamA2.css    3.58 kB │ gzip:   1.35 kB`
     `dist/assets/index-DTy-N9RV.js   381.80 kB │ gzip: 120.95 kB`
   - Observation: Entire JavaScript bundle is built as a single 381.80 kB asset without chunking (`vite.config.ts` lines 1–9).

2. **Unmemoized React Context Provider (`src/store/GameContext.tsx`)**:
   - Lines 262–266:
     ```tsx
     return (
       <GameContext.Provider value={{ state: state!, startNewGame, makeMove, togglePencilMark, undo, redo, checkSolution, profile, completeLevel }}>
         {children}
       </GameContext.Provider>
     );
     ```
   - Observation: `value` is created inline with unmemoized functions (`startNewGame`, `makeMove`, etc.), causing a fresh reference on every state update.

3. **Inline Framer Motion Render Loop (`src/components/ui/SudokuBoard.tsx`)**:
   - Lines 107–163:
     ```tsx
     {state.board.map((row, rowIndex) => 
       row.map((val, colIndex) => {
         ...
         return (
           <motion.div
             key={`${rowIndex}-${colIndex}`}
             ...
             animate={{ backgroundColor: ..., color: ... }}
           ...
     ```
   - Observation: 81 `<motion.div>` cells rendered inline without `React.memo` or component extraction. `deobfuscateSolution(state.obfuscatedSolution)` executed inline on line 55 on every render.

4. **Biased Backtracking & Greedy Cell Removal (`src/logic/sudokuGenerator.ts`)**:
   - Line 25: `const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);` inside `solve()`.
   - Line 86: `positions.sort(() => Math.random() - 0.5);`
   - Lines 88–100: Greedy cell removal loop over `positions` without backtracking. Hard mode requests `cellsToRemove = 60`, but greedy removal terminates early around 35–40 removals because single-pass candidate removals fail uniqueness checks (`countSolutions(puzzleCopy, 2) !== 1`).

5. **Unbounded History & Unthrottled Persistence (`src/store/GameContext.tsx` & `src/store/storage.ts`)**:
   - Line 98 & 128 of `GameContext.tsx`: `newHistory.push({ board: newBoard, pencilMarks: newPencilMarks })` pushes full grid snapshots into `history` on every move without limit.
   - Lines 63–67 of `GameContext.tsx`:
     ```ts
     useEffect(() => {
       if (state) { saveGame(state); }
     }, [state]);
     ```
   - Observation: Entire `state` object containing unbounded `history` array is serialized to IndexedDB via `localforage` synchronously on every single state mutation.

6. **Web Audio API Node Disconnect Missing (`src/utils/soundEffects.ts`)**:
   - Lines 11–29: `playOscillator` connects `oscillator.connect(gainNode)` and `gainNode.connect(ctx.destination)` but never attaches an `onended` listener or calls `.disconnect()`.

7. **Notes Mode Keyboard Trap (`src/components/ui/SudokuBoard.tsx`)**:
   - Lines 39–43: `else if (e.key === 'Backspace' || e.key === 'Delete') { if (selectedCell && !isNotesMode) { ... } }`
   - Observation: Keyboard deletion is blocked whenever `isNotesMode` is `true`.

---

## 2. Logic Chain

1. **From Observation 1**: Packing all code (`react`, `framer-motion`, `canvas-confetti`, `localforage`) into a single 381.80 kB JS bundle directly delays Initial JS Execution time and First Input Delay (FID) / Total Blocking Time (TBT).
2. **From Observation 2**: Because `GameContext.Provider` returns a new object reference on every render, React invalidates the context consumer subscription for all child components, causing full re-renders of `App`, `HeaderStats`, `SudokuBoard`, `BottomNav`, and active modals.
3. **From Observation 3**: Combined with Observation 2, when any cell is selected or modified, all 81 `<motion.div>` cell instances re-render. Framer Motion recalculates animation targets and styles for all 81 DOM nodes, leading to UI frame drops on lower-end mobile devices.
4. **From Observation 4**: In `sudokuGenerator.ts`, using `Math.random() - 0.5` inside recursive functions allocates arrays and applies a biased sort at every backtrack level, causing unnecessary GC pressure. Furthermore, a non-backtracking greedy removal loop fails to reach target clue counts for Hard mode (60 removals), making generated Hard puzzles no harder than Medium puzzles.
5. **From Observation 5**: Storing complete 9x9 board snapshots in an unbounded array and saving the entire payload to IndexedDB on every move creates heavy async I/O serialization overhead.
6. **From Observation 6**: Not disconnecting `OscillatorNode` and `GainNode` upon playback completion prevents audio thread nodes from being garbage collected in Web Audio API engine implementations.

---

## 3. Caveats

- **Runtime Profiling Scope**: Investigation was conducted via source code analysis and Vite build execution. Chrome DevTools Heap Snapshots and CPU Profiler traces were not run interactively in a browser instance.
- **IndexedDB Performance**: Real-world IndexedDB write latency varies significantly across user hardware (desktop vs low-end mobile devices).

---

## 4. Conclusion

`sudoku-app` suffers from critical React re-render inefficiencies (unmemoized context provider and 81 inline unmemoized animated grid cells), severe I/O serialization penalties (unbounded state history written to IndexedDB on every keypress), audio memory node retention, and flawed puzzle generation (biased backtracking shuffle and greedy removal failing Hard clue count targets).

Detailed findings, prioritized weaknesses (High/Medium/Low), and step-by-step remediation plans are documented in `C:\Users\Mark Waldeis\Desktop\sudoku-app\.agents\explorer_2b\audit_logic_perf.md`.

---

## 5. Verification Method

1. **Build & Bundle Analysis Verification**:
   - Command: `npm run build`
   - Inspect bundle output size for `dist/assets/*.js`.
   - Verify splitting after implementing `manualChunks` in `vite.config.ts`.
2. **React Re-render Verification**:
   - Inspect `src/store/GameContext.tsx` for `useCallback` and `useMemo` usage around context provider value.
   - Inspect `src/components/ui/SudokuBoard.tsx` for extracted `SudokuCell` component wrapped in `React.memo`.
3. **Generator Clue Count Verification**:
   - Run `generateSudoku('hard')` and count non-null cells remaining in `puzzle`. Verify clue count drops below 30 clues.
4. **Audio & Persistence Verification**:
   - Check `src/utils/soundEffects.ts` for `oscillator.onended` disconnect handlers.
   - Check `src/store/storage.ts` and `GameContext.tsx` for debounced save calls and capped `history` length (e.g. max 50).
