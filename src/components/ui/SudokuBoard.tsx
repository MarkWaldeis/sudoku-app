import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame, deobfuscateSolution } from '../../store/GameContext';
import { playPop, playSuccessChime, playErrorBuzz } from '../../utils/soundEffects';
import '../../styles/duolingo.css';

export const SudokuBoard: React.FC = () => {
  const { state, makeMove, togglePencilMark } = useGame();
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  const [isNotesMode, setIsNotesMode] = useState(false);

  const handleCellClick = (r: number, c: number) => {
    playPop();
    setSelectedCell({ r, c });
  };

  const handleNumberInput = React.useCallback((num: number) => {
    if (!selectedCell || !state || state.isGameOver) return;
    const { r, c } = selectedCell;
    if (isNotesMode) {
      playPop();
      togglePencilMark(r, c, num);
    } else {
      const isCorrect = makeMove(r, c, num);
      if (isCorrect === true) {
        playSuccessChime();
      } else if (isCorrect === false) {
        playErrorBuzz();
      }
    }
  }, [selectedCell, state, isNotesMode, togglePencilMark, makeMove]);

  // Keyboard support
  React.useEffect(() => {
    if (!state) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedCell && !isNotesMode) {
          playPop();
          makeMove(selectedCell.r, selectedCell.c, null);
        }
      } else if (e.key === 'n' || e.key === 'N') {
        playPop();
        setIsNotesMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, selectedCell, isNotesMode, makeMove, handleNumberInput]);

  if (!state) return null;

  const realSolution = state ? deobfuscateSolution(state.obfuscatedSolution) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      {/* Combo Floating Badge */}
      <AnimatePresence>
        {state.comboCount > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: -20, scale: 1.2 }}
            exit={{ opacity: 0, y: -40 }}
            style={{
              position: 'absolute',
              top: '-10px',
              backgroundColor: 'var(--duo-yellow)',
              color: 'var(--duo-text-dark)',
              padding: '6px 16px',
              borderRadius: '20px',
              fontWeight: 900,
              boxShadow: '0 4px 0 var(--duo-yellow-shadow)',
              zIndex: 10
            }}
          >
            🔥 {state.comboCount}x Combo!
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{ 
          padding: '16px', 
          backgroundColor: 'white', 
          borderRadius: '24px', 
          boxShadow: '0 8px 0 var(--duo-gray-shadow)',
          border: '2px solid var(--duo-gray)',
          margin: '20px auto'
        }}
      >
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(9, 1fr)',
            gap: '3px',
            backgroundColor: 'var(--duo-gray)',
            border: '3px solid var(--duo-text-dark)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          {state.board.map((row, rowIndex) => 
            row.map((val, colIndex) => {
              const isRightBorder = (colIndex + 1) % 3 === 0 && colIndex !== 8;
              const isBottomBorder = (rowIndex + 1) % 3 === 0 && rowIndex !== 8;
              const isSelected = selectedCell?.r === rowIndex && selectedCell?.c === colIndex;
              const isRelated = selectedCell && (selectedCell.r === rowIndex || selectedCell.c === colIndex);
              const isInitial = state.initialBoard[rowIndex][colIndex] !== null;
              const isWrong = !isInitial && val !== null && realSolution && val !== realSolution[rowIndex][colIndex];
              
              const pencilMarks = state.pencilMarks[`${rowIndex}-${colIndex}`] || [];

              return (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ 
                    backgroundColor: isSelected 
                      ? 'var(--duo-blue)' 
                      : isWrong
                        ? '#ffe5e5'
                        : isRelated 
                          ? '#e5f6ff' 
                          : 'white',
                    color: isSelected ? 'white' : isWrong ? 'var(--duo-red)' : isInitial ? 'var(--duo-text-dark)' : 'var(--duo-green)'
                  }}
                  style={{
                    width: 'clamp(32px, 8.5vw, 52px)',
                    height: 'clamp(32px, 8.5vw, 52px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(1.1rem, 4vw, 1.6rem)',
                    fontWeight: isInitial ? 900 : 700,
                    borderRight: isRightBorder ? '3px solid var(--duo-text-dark)' : 'none',
                    borderBottom: isBottomBorder ? '3px solid var(--duo-text-dark)' : 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    userSelect: 'none'
                  }}
                >
                  {val !== null ? (
                    <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }}>{val}</motion.span>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', width: '100%', height: '100%', padding: '2px' }}>
                      {[1,2,3,4,5,6,7,8,9].map(n => (
                        <span key={n} style={{ fontSize: '0.55rem', color: 'var(--duo-text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                          {pencilMarks.includes(n) ? n : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
      
      {/* 3D Numpad & Controls */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '480px', padding: '0 10px' }}>
        {[1,2,3,4,5,6,7,8,9].map(num => (
          <button 
            key={num}
            onClick={() => handleNumberInput(num)}
            className="btn-duo btn-duo-gray"
            style={{
              width: '46px', 
              height: '48px', 
              fontSize: '1.3rem',
              fontWeight: 800,
              padding: 0
            }}
          >
            {num}
          </button>
        ))}
        <button 
          onClick={() => {
            if (selectedCell && !isNotesMode) {
              playPop();
              makeMove(selectedCell.r, selectedCell.c, null);
            }
          }}
          className="btn-duo btn-duo-gray"
          style={{
            height: '48px',
            padding: '0 12px',
            fontSize: '1rem',
            fontWeight: 800
          }}
        >
          ⌫
        </button>
        <button 
          onClick={() => {
            playPop();
            setIsNotesMode(!isNotesMode);
          }}
          className={`btn-duo ${isNotesMode ? 'btn-duo-green' : 'btn-duo-gray'}`}
          style={{
            height: '48px',
            padding: '0 18px',
            fontSize: '1rem',
            fontWeight: 800
          }}
        >
          📝 Notizen {isNotesMode ? 'AN' : 'AUS'}
        </button>
      </div>
    </div>
  );
};
