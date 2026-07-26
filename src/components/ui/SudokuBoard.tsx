import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../store/GameContext';
import '../../styles/variables.css';

export const SudokuBoard: React.FC = () => {
  const { state, makeMove, togglePencilMark } = useGame();
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  const [isNotesMode, setIsNotesMode] = useState(false);

  if (!state) return null;

  const handleCellClick = (r: number, c: number) => {
    setSelectedCell({ r, c });
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    if (isNotesMode) {
      togglePencilMark(r, c, num);
    } else {
      makeMove(r, c, num);
    }
  };

  // Keyboard support
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedCell && !isNotesMode) {
          makeMove(selectedCell.r, selectedCell.c, null);
        }
      } else if (e.key === 'n' || e.key === 'N') {
        setIsNotesMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, isNotesMode, makeMove, togglePencilMark]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <motion.div 
        className="card-glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ padding: '20px', margin: '20px auto' }}
      >
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(9, 1fr)',
            gap: '2px',
            background: 'var(--border-glass)',
            border: '2px solid var(--accent-primary)',
            borderRadius: 'var(--radius-sm)',
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
              
              const pencilMarks = state.pencilMarks[`${rowIndex}-${colIndex}`] || [];

              return (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  whileHover={{ backgroundColor: 'var(--bg-card-hover)' }}
                  animate={{ 
                    backgroundColor: isSelected 
                      ? 'rgba(99, 102, 241, 0.5)' 
                      : isRelated 
                        ? 'rgba(99, 102, 241, 0.15)' 
                        : 'var(--bg-secondary)'
                  }}
                  style={{
                    width: 'clamp(30px, 8vw, 50px)',
                    height: 'clamp(30px, 8vw, 50px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(1rem, 4vw, 1.5rem)',
                    fontWeight: isInitial ? 700 : 400,
                    color: isInitial ? 'var(--text-main)' : 'var(--accent-primary)',
                    borderRight: isRightBorder ? '2px solid var(--accent-primary)' : 'none',
                    borderBottom: isBottomBorder ? '2px solid var(--accent-primary)' : 'none',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {val !== null ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>{val}</motion.span>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', width: '100%', height: '100%', padding: '2px' }}>
                      {[1,2,3,4,5,6,7,8,9].map(n => (
                        <span key={n} style={{ fontSize: '0.5rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center', padding: '0 10px' }}>
        {[1,2,3,4,5,6,7,8,9].map(num => (
          <button 
            key={num}
            onClick={() => handleNumberInput(num)}
            className="btn-interactive"
            style={{
              width: '45px', height: '45px', 
              background: 'var(--bg-card)', 
              color: 'var(--text-main)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1.2rem',
              cursor: 'pointer'
            }}
          >
            {num}
          </button>
        ))}
        <button 
          onClick={() => setIsNotesMode(!isNotesMode)}
          className="btn-interactive"
          style={{
            padding: '0 15px',
            height: '45px',
            background: isNotesMode ? 'var(--accent-primary)' : 'var(--bg-card)', 
            color: 'var(--text-main)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          📝 Notes {isNotesMode ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
};
