import React from 'react';
import { TrophyIcon, TimerIcon, FlameIcon, BoltIcon, GemIcon, HeartIcon } from './icons';
import { playPop } from '../../utils/soundEffects';
import { hapticTap } from '../../utils/haptics';
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

const statChip: React.CSSProperties = {
  display: 'flex',
  gap: '5px',
  alignItems: 'center',
  minHeight: '36px',
  whiteSpace: 'nowrap',
};

export const HeaderStats: React.FC<HeaderStatsProps> = ({
  streak,
  lives,
  xp,
  level,
  gems,
  timerSeconds,
  onOpenShop,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const shopButtonStyle: React.CSSProperties = {
    ...statChip,
    minHeight: '44px',
    padding: '4px 10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    font: 'inherit',
    borderRadius: '12px',
  };

  return (
    <div
      className="header-stats"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '4px 8px',
        padding: '12px 16px',
        /* iOS notch / status bar never covers the stats */
        paddingTop: 'calc(12px + var(--sat, 0px))',
        paddingLeft: 'calc(16px + var(--sal, 0px))',
        paddingRight: 'calc(16px + var(--sar, 0px))',
        backgroundColor: 'var(--duo-bg-card)',
        borderBottom: '2px solid var(--duo-gray)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 'bold',
        color: 'var(--duo-text-dark)',
        fontSize: '0.9rem',
      }}
    >
      <div style={{ ...statChip, color: '#ff9600' }} aria-label={`Level ${level}`}>
        <TrophyIcon size={20} />
        <span>Lvl {level}</span>
      </div>

      {timerSeconds !== undefined && (
        <div
          style={{
            ...statChip,
            color: 'var(--duo-text-dark)',
            backgroundColor: 'var(--duo-bg-subtle)',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.85rem',
          }}
          aria-label={`Spielzeit ${formatTime(timerSeconds)}`}
        >
          <TimerIcon size={18} />
          <span>{formatTime(timerSeconds)}</span>
        </div>
      )}

      <div style={{ ...statChip, color: '#ff9600' }} aria-label={`Streak: ${streak} Tage`}>
        <FlameIcon size={20} />
        <span>{streak}</span>
      </div>

      <div style={{ ...statChip, color: 'var(--duo-blue)' }} aria-label={`${xp} Erfahrungspunkte`}>
        <BoltIcon size={20} />
        <span>{xp} XP</span>
      </div>

      <button
        onClick={() => {
          playPop();
          hapticTap();
          onOpenShop?.();
        }}
        style={{
          ...shopButtonStyle,
          color: '#d48800',
          backgroundColor: 'var(--duo-gem-chip-bg)',
          border: '1px solid var(--duo-yellow-shadow)',
        }}
        aria-label={`${gems} Edelsteine – Shop öffnen`}
      >
        <GemIcon size={20} />
        <span>{gems}</span>
      </button>

      <button
        onClick={() => {
          playPop();
          hapticTap();
          onOpenShop?.();
        }}
        style={{ ...shopButtonStyle, color: 'var(--duo-red)' }}
        aria-label={`${lives} Herzen – Shop öffnen`}
      >
        <HeartIcon size={20} />
        <span>{lives}</span>
      </button>
    </div>
  );
};
