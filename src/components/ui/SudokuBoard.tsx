import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../store/GameContext';
import { playPop, playSuccessChime, playErrorBuzz } from '../../utils/soundEffects';
import { hapticTap, hapticSuccess, hapticError } from '../../utils/haptics';
import { BulbIcon, NotesIcon, BackspaceIcon, FlameIcon } from './icons';
import '../../styles/duolingo.css';

const SPARK_COLORS = ['#58cc02', '#ffc800', '#1cb0f6', '#ce82ff'];

/** Lightweight spark burst rendered at the cell that was just solved. */
const SparkBurst: React.FC<{ row: number; col: number }> = ({ row, col }) => {
  const particles = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2 + 0.35;
    const dist = 26 + ((i * 13) % 18);
    return {
      id: i,
      sx: `${Math.cos(angle) * dist}px`,
      sy: `${Math.sin(angle) * dist}px`,
      color: SPARK_COLORS[i % SPARK_COLORS.length],
      delay: (i % 3) * 30,
    };
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: `${((col + 0.5) / 9) * 100}%`,
        top: `${((row + 0.5) / 9) * 100}%`,
        pointerEvents: 'none',
        zIndex: 15,
      }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="spark-particle"
          style={
            {
              '--sx': p.sx,
              '--sy': p.sy,
              backgroundColor: p.color,
              animationDelay: `${p.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

export const SudokuBoard: React.FC<{ victoryWave?: boolean }> = ({ victoryWave = false }) => {
  const { state, solution, makeMove, togglePencilMark, useHint: requestHint, profile } = useGame();
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [burst, setBurst] = useState<{ r: number; c: number; key: number } | null>(null);
  const burstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset per-game UI state when a fresh board arrives
  useEffect(() => {
    setSelectedCell(null);
    setBurst(null);
    setIsShaking(false);
  }, [state?.initialBoard]);

  // Game juice: screen shake on mistakes (driven by context move results)
  useEffect(() => {
    if (state?.lastMoveResult?.kind === 'wrong') {
      setIsShaking(true);
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = setTimeout(() => setIsShaking(false), 460);
    }
    return () => {
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    };
  }, [state?.lastMoveResult]);

  useEffect(() => {
    return () => {
      if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
    };
  }, []);

  const handleCellClick = useCallback((r: number, c: number) => {
    playPop();
    hapticTap();
    setSelectedCell({ r, c });
  }, []);

  const handleNumberInput = useCallback(
    (num: number) => {
      if (!selectedCell || !state || state.isGameOver || victoryWave) return;
      const { r, c } = selectedCell;
      if (isNotesMode) {
        playPop();
        hapticTap();
        togglePencilMark(r, c, num);
      } else {
        const isCorrect = makeMove(r, c, num);
        if (isCorrect === true) {
          playSuccessChime();
          hapticSuccess();
          setBurst({ r, c, key: Date.now() });
          if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
          burstTimeoutRef.current = setTimeout(() => setBurst(null), 650);
        } else if (isCorrect === false) {
          playErrorBuzz();
          hapticError();
        }
      }
    },
    [selectedCell, state, isNotesMode, togglePencilMark, makeMove, victoryWave]
  );

  const handleErase = useCallback(() => {
    if (selectedCell && !isNotesMode && state && !state.isGameOver && !victoryWave) {
      playPop();
      hapticTap();
      makeMove(selectedCell.r, selectedCell.c, null);
    }
  }, [selectedCell, isNotesMode, state, makeMove, victoryWave]);

  // Keyboard support: digits, erase, notes toggle, hint, arrows, escape
  useEffect(() => {
    if (!state) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleErase();
      } else if (e.key === 'n' || e.key === 'N') {
        playPop();
        setIsNotesMode((prev) => !prev);
      } else if (e.key === 'h' || e.key === 'H') {
        if (!victoryWave && requestHint(selectedCell)) {
          playSuccessChime();
          hapticSuccess();
        }
      } else if (e.key === 'Escape') {
        setSelectedCell(null);
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        setSelectedCell((prev) => {
          const cur = prev ?? { r: 4, c: 4 };
          const delta: Record<string, [number, number]> = {
            ArrowUp: [-1, 0],
            ArrowDown: [1, 0],
            ArrowLeft: [0, -1],
            ArrowRight: [0, 1],
          };
          const [dr, dc] = delta[e.key] ?? [0, 0];
          return {
            r: Math.min(8, Math.max(0, cur.r + dr)),
            c: Math.min(8, Math.max(0, cur.c + dc)),
          };
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, selectedCell, isNotesMode, makeMove, handleNumberInput, handleErase, requestHint, victoryWave]);

  const selectedValue =
    state && selectedCell && state.board[selectedCell.r][selectedCell.c] !== null
      ? state.board[selectedCell.r][selectedCell.c]
      : null;

  // Digits that are already fully placed (9 correct copies) – hidden from the numpad
  const completedDigits = useMemo(() => {
    const done = new Set<number>();
    if (!state || !solution) return done;
    const counts = new Array<number>(10).fill(0);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = state.board[r][c];
        if (v !== null && v === solution[r][c]) counts[v]++;
      }
    }
    for (let n = 1; n <= 9; n++) {
      if (counts[n] >= 9) done.add(n);
    }
    return done;
  }, [state, solution]);

  // Cross-hatch: every row, column and 3x3 box that already contains the
  // selected digit – makes it easy to see where that digit can still go.
  const numberSight = useMemo(() => {
    if (!state || selectedValue === null) return null;
    const seen = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (state.board[r][c] !== selectedValue) continue;
        for (let i = 0; i < 9; i++) {
          seen.add(`${r}-${i}`);
          seen.add(`${i}-${c}`);
        }
        const br = Math.floor(r / 3) * 3;
        const bc = Math.floor(c / 3) * 3;
        for (let dr = 0; dr < 3; dr++) {
          for (let dc = 0; dc < 3; dc++) {
            seen.add(`${br + dr}-${bc + dc}`);
          }
        }
      }
    }
    return seen;
  }, [state, selectedValue]);

  if (!state) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      {/* Combo Floating Badge */}
      <AnimatePresence>
        {state.comboCount > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: -20, scale: 1.08 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: 'absolute',
              top: '-10px',
              backgroundColor: 'var(--duo-yellow)',
              color: 'var(--duo-text-dark)',
              padding: '6px 16px',
              borderRadius: '20px',
              fontWeight: 900,
              boxShadow: '0 4px 0 var(--duo-yellow-shadow)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FlameIcon size={18} />
            {state.comboCount}x Combo!
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        style={{
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '24px',
          boxShadow: '0 8px 0 var(--duo-gray-shadow)',
          border: '2px solid var(--duo-gray)',
          margin: '20px auto',
        }}
      >
        <div
          className={isShaking ? 'board-shake' : undefined}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(9, 1fr)',
            gap: '3px',
            backgroundColor: 'var(--duo-gray)',
            border: '3px solid var(--duo-text-dark)',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {state.board.map((row, rowIndex) =>
            row.map((val, colIndex) => {
              const isRightBorder = (colIndex + 1) % 3 === 0 && colIndex !== 8;
              const isBottomBorder = (rowIndex + 1) % 3 === 0 && rowIndex !== 8;
              const isSelected = selectedCell?.r === rowIndex && selectedCell?.c === colIndex;
              const isRelated =
                !!selectedCell && !isSelected && (selectedCell.r === rowIndex || selectedCell.c === colIndex);
              const isSameNumber =
                !isSelected && selectedValue !== null && val !== null && val === selectedValue;
              const isInNumberSight =
                !isSelected && !isSameNumber && !!numberSight?.has(`${rowIndex}-${colIndex}`);
              const isInitial = state.initialBoard[rowIndex][colIndex] !== null;
              const isWrong =
                !isInitial && val !== null && !!solution && val !== solution[rowIndex][colIndex];
              const isHinted = state.hintedCell?.r === rowIndex && state.hintedCell?.c === colIndex;

              const pencilMarks = state.pencilMarks[`${rowIndex}-${colIndex}`] || [];

              // Victory wave: diagonal stagger from bottom-left (0) to top-right (16)
              const waveDelay = (8 - rowIndex + colIndex) * 45;

              const bg = isHinted
                ? '#fff4cc'
                : isSelected
                  ? 'var(--duo-blue)'
                  : isWrong
                    ? '#ffe5e5'
                    : isSameNumber
                      ? '#b3e3fd'
                      : isInNumberSight
                        ? '#eaf7ff'
                        : isRelated
                          ? '#e5f6ff'
                          : 'white';

              const fg = isSelected
                ? 'white'
                : isWrong
                  ? 'var(--duo-red)'
                  : isInitial
                    ? 'var(--duo-text-dark)'
                    : 'var(--duo-green)';

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  role="button"
                  aria-label={`Zelle Reihe ${rowIndex + 1}, Spalte ${colIndex + 1}${val ? `, Wert ${val}` : ', leer'}`}
                  className={victoryWave ? 'victory-wave-cell' : undefined}
                  style={{
                    width: 'clamp(30px, min(8.5vw, 5.6vh), 52px)',
                    height: 'clamp(30px, min(8.5vw, 5.6vh), 52px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(1.1rem, 4vw, 1.6rem)',
                    fontWeight: isInitial ? 900 : 700,
                    borderRight: isRightBorder ? '3px solid var(--duo-text-dark)' : 'none',
                    borderBottom: isBottomBorder ? '3px solid var(--duo-text-dark)' : 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    userSelect: 'none',
                    backgroundColor: bg,
                    color: fg,
                    boxShadow: isHinted
                      ? 'inset 0 0 12px #ffc800'
                      : isSameNumber
                        ? 'inset 0 0 10px #4fb8f7'
                        : 'none',
                    animationDelay: victoryWave ? `${waveDelay}ms` : undefined,
                    transition:
                      'background-color 120ms var(--ease-out), color 120ms var(--ease-out), transform 100ms var(--ease-out)',
                  }}
                  onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.94)')}
                  onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {val !== null ? (
                    <span
                      key={val}
                      className={victoryWave ? 'victory-wave-number' : 'cell-pop'}
                      style={{ display: 'inline-block', animationDelay: victoryWave ? `${waveDelay}ms` : undefined }}
                    >
                      {val}
                    </span>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        width: '100%',
                        height: '100%',
                        padding: '2px',
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <span
                          key={n}
                          style={{
                            fontSize: '0.55rem',
                            color: 'var(--duo-text-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                          }}
                        >
                          {pencilMarks.includes(n) ? n : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Spark burst overlay for the last correctly solved cell */}
          {burst && <SparkBurst key={burst.key} row={burst.r} col={burst.c} />}
        </div>
      </motion.div>

      {/* 3D Numpad & Controls */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: '10px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '480px',
          padding: '0 10px',
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const isComplete = completedDigits.has(num);
          return (
            <button
              key={num}
              onClick={() => handleNumberInput(num)}
              className="btn-duo btn-duo-gray"
              aria-label={`Zahl ${num} eingeben`}
              aria-hidden={isComplete}
              disabled={isComplete}
              tabIndex={isComplete ? -1 : 0}
              style={{
                width: '48px',
                height: '48px',
                fontSize: '1.3rem',
                fontWeight: 800,
                padding: 0,
                opacity: isComplete ? 0 : 1,
                pointerEvents: isComplete ? 'none' : undefined,
                transition: 'opacity 300ms var(--ease-out)',
              }}
            >
              {num}
            </button>
          );
        })}
        <button
          onClick={handleErase}
          className="btn-duo btn-duo-gray"
          aria-label="Zelle löschen"
          style={{ height: '48px', padding: '0 14px', fontSize: '1rem', fontWeight: 800 }}
        >
          <BackspaceIcon size={20} />
        </button>
        <button
          onClick={() => {
            if (victoryWave) return;
            if (requestHint(selectedCell)) {
              playSuccessChime();
              hapticSuccess();
            } else {
              playErrorBuzz();
              hapticError();
            }
          }}
          className="btn-duo btn-duo-yellow"
          style={{ height: '48px', padding: '0 14px', fontSize: '0.95rem', fontWeight: 800 }}
        >
          <BulbIcon size={20} />
          Tipp ({profile.hints > 0 ? profile.hints : '💎20'})
        </button>
        <button
          onClick={() => {
            playPop();
            hapticTap();
            setIsNotesMode(!isNotesMode);
          }}
          className={`btn-duo ${isNotesMode ? 'btn-duo-purple' : 'btn-duo-gray'}`}
          aria-pressed={isNotesMode}
          style={{ height: '48px', padding: '0 14px', fontSize: '0.95rem', fontWeight: 800 }}
        >
          <NotesIcon size={20} />
          Notizen {isNotesMode ? 'AN' : 'AUS'}
        </button>
      </div>
    </div>
  );
};
