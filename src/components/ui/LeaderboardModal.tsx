import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../store/GameContext';
import { getLeaderboard } from '../../services/leaderboardService';
import { playPop } from '../../utils/soundEffects';
import '../../styles/duolingo.css';

interface LeaderboardModalProps {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const { profile } = useGame();
  const leaderboard = getLeaderboard(profile.xp);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          backgroundColor: 'white',
          padding: '28px',
          borderRadius: '24px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 8px 0 var(--duo-gray-shadow)',
          border: '3px solid var(--duo-yellow)',
          position: 'relative',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: 900,
          color: 'var(--duo-text-dark)',
          marginBottom: '6px',
          textAlign: 'center'
        }}>
          🏆 Sudoku Liga
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--duo-text-light)', fontSize: '0.9rem', marginBottom: '20px', fontWeight: 700 }}>
          Sammle XP in Spielen, um in der Rangliste aufzusteigen!
        </p>

        <div style={{
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '20px',
          paddingRight: '4px'
        }}>
          {leaderboard.map((entry, index) => {
            const rank = index + 1;
            const rankBadge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  backgroundColor: entry.isCurrentUser ? '#e5f6ff' : 'var(--duo-bg-light)',
                  border: entry.isCurrentUser ? '2px solid var(--duo-blue)' : '2px solid transparent',
                  boxShadow: entry.isCurrentUser ? '0 4px 0 var(--duo-blue-shadow)' : 'none'
                }}
              >
                <span style={{ fontSize: '1.2rem', fontWeight: 900, width: '40px' }}>
                  {rankBadge}
                </span>
                <span style={{ fontSize: '1.6rem', marginRight: '12px' }}>
                  {entry.avatar}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: 'var(--duo-text-dark)', fontSize: '1rem' }}>
                    {entry.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--duo-purple)', fontWeight: 700 }}>
                    Liga: {entry.league}
                  </div>
                </div>
                <div style={{ fontWeight: 900, color: 'var(--duo-yellow)', fontSize: '1.1rem' }}>
                  {entry.xp} XP
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="btn-duo btn-duo-yellow"
          onClick={() => {
            playPop();
            onClose();
          }}
          style={{ width: '100%', fontSize: '1.1rem' }}
        >
          Fertig
        </button>
      </motion.div>
    </div>
  );
};
