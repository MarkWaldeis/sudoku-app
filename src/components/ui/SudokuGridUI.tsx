import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/variables.css';

export const SudokuGridUI: React.FC = () => {
  // A visual representation layout of a Sudoku grid (9x9)
  const grid = Array(9).fill(null).map(() => Array(9).fill(''));
  
  return (
    <motion.div 
      className="card-glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        padding: '20px',
        display: 'inline-block',
        margin: '20px auto'
      }}
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
        {grid.map((row, rowIndex) => 
          row.map((_, colIndex) => {
            const isRightBorder = (colIndex + 1) % 3 === 0 && colIndex !== 8;
            const isBottomBorder = (rowIndex + 1) % 3 === 0 && rowIndex !== 8;
            
            return (
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                whileHover={{ backgroundColor: 'var(--bg-card-hover)' }}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  color: 'var(--accent-primary)',
                  borderRight: isRightBorder ? '2px solid var(--accent-primary)' : 'none',
                  borderBottom: isBottomBorder ? '2px solid var(--accent-primary)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {/* Visual placeholder for numbers */}
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
