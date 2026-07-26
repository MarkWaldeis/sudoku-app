import React from 'react';
import '../../styles/duolingo.css';

interface HeaderStatsProps {
  streak: number;
  lives: number;
  xp: number;
  level: number;
}

export const HeaderStats: React.FC<HeaderStatsProps> = ({ streak, lives, xp, level }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      backgroundColor: 'white',
      borderBottom: '2px solid var(--duo-gray)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      fontFamily: "'Nunito', sans-serif",
      fontWeight: 'bold',
      color: 'var(--duo-text-dark)'
    }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#ff9600' }}>
        <span style={{ fontSize: '1.5rem' }}>🏆</span>
        <span>Lvl {level}</span>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#ff9600' }}>
        <span style={{ fontSize: '1.5rem' }}>🔥</span>
        <span>{streak}</span>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--duo-blue)' }}>
        <span style={{ fontSize: '1.5rem' }}>⚡</span>
        <span>{xp} XP</span>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--duo-red)' }}>
        <span style={{ fontSize: '1.5rem' }}>❤️</span>
        <span>{lives}</span>
      </div>
    </div>
  );
};
