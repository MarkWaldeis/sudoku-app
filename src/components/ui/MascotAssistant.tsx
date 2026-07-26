import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../../styles/duolingo.css';
import { playPop } from '../../utils/soundEffects';

interface MascotAssistantProps {
  message?: string;
}

export const MascotAssistant: React.FC<MascotAssistantProps> = ({ 
  message = "Du schaffst das! Finde die fehlenden Zahlen." 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '16px',
      display: 'flex',
      alignItems: 'flex-end',
      gap: '12px',
      zIndex: 999,
      transition: 'opacity 0.3s',
      opacity: isVisible ? 1 : 0,
      pointerEvents: isVisible ? 'auto' : 'none'
    }}>
      {/* Mascot Image (Animated) */}
      <motion.div 
        className="mascot-float"
        onClick={() => playPop()}
        style={{ 
          cursor: 'pointer',
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '4px solid var(--duo-gray)',
          boxShadow: '0 4px 0 var(--duo-gray-shadow)',
          flexShrink: 0,
          backgroundColor: 'white'
        }}
        whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
        whileTap={{ scale: 0.9 }}
        animate={{ y: [0, -8, 0] }}
        transition={{ 
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 0.5 }
        }}
      >
        <img 
          src="/mascot.jpg" 
          alt="Sudoku Mascot" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      </motion.div>

      {/* Speech Bubble */}
      <div style={{
        backgroundColor: 'white',
        border: '2px solid var(--duo-gray)',
        borderRadius: '16px',
        padding: '16px 20px',
        position: 'relative',
        boxShadow: '0 4px 0 var(--duo-gray-shadow)',
        marginBottom: '20px',
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 'bold',
        color: 'var(--duo-text-dark)',
        maxWidth: '250px'
      }}>
        {/* Tail */}
        <div style={{
          position: 'absolute',
          bottom: '-10px',
          left: '-10px',
          width: '20px',
          height: '20px',
          backgroundColor: 'white',
          borderBottom: '2px solid var(--duo-gray)',
          borderLeft: '2px solid var(--duo-gray)',
          transform: 'rotate(45deg)',
          boxShadow: '-2px 2px 0 var(--duo-gray-shadow)'
        }} />
        
        {message}
        
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            position: 'absolute',
            top: '4px',
            right: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--duo-text-light)',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};
