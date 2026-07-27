import React from 'react';
import { playPop } from '../../utils/soundEffects';
import '../../styles/duolingo.css';

interface BottomNavProps {
  currentTab: 'campaign' | 'game' | 'extreme' | 'stats' | 'leaderboard' | 'shop';
  onSelectTab: (tab: 'campaign' | 'game' | 'extreme' | 'stats' | 'leaderboard' | 'shop') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'campaign', label: 'Pfad', icon: '🗺️' },
    { id: 'game', label: 'Spiel', icon: '⚡' },
    { id: 'extreme', label: 'Extrem', icon: '💀' },
    { id: 'shop', label: 'Shop', icon: '🛒' },
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'leaderboard', label: 'Liga', icon: '🏆' }
  ] as const;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '68px',
      backgroundColor: 'white',
      borderTop: '2px solid var(--duo-gray)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000,
      boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
      padding: '0 8px'
    }}>
      {tabs.map(tab => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              playPop();
              onSelectTab(tab.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '16px',
              transition: 'all 0.15s ease',
              backgroundColor: isActive ? '#e5f6ff' : 'transparent',
              transform: isActive ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>{tab.icon}</span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: isActive ? 'var(--duo-blue)' : 'var(--duo-text-light)',
              marginTop: '2px'
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
