import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../store/GameContext';
import { getLeaderboard } from '../../services/leaderboardService';
import { playPop } from '../../utils/soundEffects';
import { hapticTap } from '../../utils/haptics';
import { ModalShell } from './ModalShell';
import { TrophyIcon } from './icons';
import '../../styles/duolingo.css';

interface LeaderboardModalProps {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const { profile } = useGame();
  const leaderboard = getLeaderboard(profile.xp);

  return (
    <ModalShell onClose={onClose} maxWidth={420}>
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 900,
          color: 'var(--duo-text-dark)',
          margin: '0 0 6px 0',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <span style={{ color: 'var(--duo-yellow)', display: 'inline-flex' }}>
          <TrophyIcon size={26} />
        </span>
        Sudoku Liga
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--duo-text-light)', fontSize: '0.9rem', margin: '0 0 18px 0', fontWeight: 700 }}>
        Sammle XP in Spielen, um in der Rangliste aufzusteigen!
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        {leaderboard.map((entry, index) => {
          const rank = index + 1;
          const rankBadge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: '16px',
                backgroundColor: entry.isCurrentUser ? '#e5f6ff' : 'var(--duo-bg-light)',
                border: entry.isCurrentUser ? '2px solid var(--duo-blue)' : '2px solid transparent',
                boxShadow: entry.isCurrentUser ? '0 4px 0 var(--duo-blue-shadow)' : 'none',
              }}
            >
              <span style={{ fontSize: '1.1rem', fontWeight: 900, width: '40px' }}>{rankBadge}</span>
              <span style={{ fontSize: '1.5rem', marginRight: '12px' }} aria-hidden="true">
                {entry.avatar}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 800,
                    color: 'var(--duo-text-dark)',
                    fontSize: '0.95rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--duo-purple)', fontWeight: 700 }}>
                  Liga: {entry.league}
                </div>
              </div>
              <div style={{ fontWeight: 900, color: 'var(--duo-yellow-shadow)', fontSize: '1.05rem' }}>
                {entry.xp} XP
              </div>
            </motion.div>
          );
        })}
      </div>

      <button
        className="btn-duo btn-duo-yellow"
        onClick={() => {
          playPop();
          hapticTap();
          onClose();
        }}
        style={{ width: '100%', fontSize: '1.05rem' }}
      >
        Fertig
      </button>
    </ModalShell>
  );
};
