import React, { useState } from 'react';
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
      bottom: '20px',
      left: '20px',
      display: 'flex',
      alignItems: 'flex-end',
      gap: '16px',
      zIndex: 1000,
      transition: 'opacity 0.3s',
      opacity: isVisible ? 1 : 0,
      pointerEvents: isVisible ? 'auto' : 'none'
    }}>
      {/* Mascot SVG (Sudo Owl) */}
      <div 
        className="mascot-float"
        onClick={() => playPop()}
        style={{ cursor: 'pointer' }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Owl Body */}
          <circle cx="50" cy="50" r="40" fill="var(--duo-green)" />
          {/* Eyes */}
          <circle cx="35" cy="45" r="15" fill="white" />
          <circle cx="65" cy="45" r="15" fill="white" />
          <circle cx="35" cy="45" r="5" fill="var(--duo-text-dark)" />
          <circle cx="65" cy="45" r="5" fill="var(--duo-text-dark)" />
          {/* Beak */}
          <path d="M50 55 L45 65 L55 65 Z" fill="var(--duo-yellow)" />
          {/* Wings */}
          <path d="M15 55 Q 5 65 10 75 Q 25 70 25 60 Z" fill="var(--duo-green-shadow)" />
          <path d="M85 55 Q 95 65 90 75 Q 75 70 75 60 Z" fill="var(--duo-green-shadow)" />
        </svg>
      </div>

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
