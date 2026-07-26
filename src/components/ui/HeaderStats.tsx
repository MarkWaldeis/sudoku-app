import React from 'react';
import '../../styles/duolingo.css';

interface HeaderStatsProps {
  streak: number;
  lives: number;
  xp: number;
  level: number;
  gems: number;
  timerSeconds?: number;
  onOpenShop?: () => void;
}

export const HeaderStats: React.FC<HeaderStatsProps> = ({ streak, lives, xp, level, gems, timerSeconds, onOpenShop }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      backgroundColor: 'white',
      borderBottom: '2px solid var(--duo-gray)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      fontFamily: "'Nunito', sans-serif",
      fontWeight: 'bold',
      color: 'var(--duo-text-dark)',
      fontSize: '0.9rem'
    }}>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', color: '#ff9600' }}>
        <span style={{ fontSize: '1.2rem' }}>🏆</span>
        <span>Lvl {level}</span>
      </div>

      {timerSeconds !== undefined && (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', color: 'var(--duo-text-dark)', backgroundColor: '#f0f0f0', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>
          <span style={{ fontSize: '1rem' }}>⏱️</span>
          <span>{formatTime(timerSeconds)}</span>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', color: '#ff9600' }}>
        <span style={{ fontSize: '1.2rem' }}>🔥</span>
        <span>{streak}</span>
      </div>
      
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', color: 'var(--duo-blue)' }}>
        <span style={{ fontSize: '1.2rem' }}>⚡</span>
        <span>{xp} XP</span>
      </div>

      <div 
        onClick={onOpenShop}
        style={{ 
          display: 'flex', 
          gap: '4px', 
          alignItems: 'center', 
          color: '#d48800',
          cursor: 'pointer',
          backgroundColor: '#fff4cc',
          padding: '4px 8px',
          borderRadius: '12px',
          border: '1px solid var(--duo-yellow-shadow)'
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>💎</span>
        <span>{gems}</span>
      </div>
      
      <div 
        onClick={onOpenShop}
        style={{ display: 'flex', gap: '4px', alignItems: 'center', color: 'var(--duo-red)', cursor: 'pointer' }}
      >
        <span style={{ fontSize: '1.2rem' }}>❤️</span>
        <span>{lives}</span>
      </div>
    </div>
  );
};
