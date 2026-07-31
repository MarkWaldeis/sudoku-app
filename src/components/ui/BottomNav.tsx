import React from 'react';
import { motion } from 'framer-motion';
import { playPop } from '../../utils/soundEffects';
import { hapticTap } from '../../utils/haptics';
import { MapIcon, BoltIcon, SkullIcon, CartIcon, ChartIcon, TrophyIcon } from './icons';
import '../../styles/duolingo.css';

type TabId = 'campaign' | 'game' | 'extreme' | 'stats' | 'leaderboard' | 'shop';

interface BottomNavProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: 'campaign', label: 'Pfad', Icon: MapIcon },
  { id: 'game', label: 'Spiel', Icon: BoltIcon },
  { id: 'extreme', label: 'Extrem', Icon: SkullIcon },
  { id: 'shop', label: 'Shop', Icon: CartIcon },
  { id: 'stats', label: 'Stats', Icon: ChartIcon },
  { id: 'leaderboard', label: 'Liga', Icon: TrophyIcon },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  return (
    <nav
      aria-label="Hauptnavigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '2px solid var(--duo-gray)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'stretch',
        zIndex: 1000,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
        padding: '4px 8px',
        /* iOS home indicator never covers the tab bar */
        paddingBottom: 'calc(4px + var(--sab, 0px))',
        paddingLeft: 'calc(8px + var(--sal, 0px))',
        paddingRight: 'calc(8px + var(--sar, 0px))',
      }}
    >
      {tabs.map(({ id, label, Icon }) => {
        const isActive = currentTab === id;
        return (
          <button
            key={id}
            onClick={() => {
              playPop();
              hapticTap();
              onSelectTab(id);
            }}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              /* >= 44px touch target on every tab */
              minWidth: '48px',
              minHeight: '56px',
              padding: '6px 10px',
              borderRadius: '16px',
              position: 'relative',
              color: isActive ? 'var(--duo-blue)' : 'var(--duo-text-light)',
              transition: 'color 150ms var(--ease-out), transform 100ms var(--ease-out)',
            }}
            onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.94)')}
            onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isActive && (
              <motion.span
                layoutId="bottomnav-active-pill"
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  position: 'absolute',
                  inset: '2px 0',
                  backgroundColor: '#e5f6ff',
                  borderRadius: '16px',
                  zIndex: 0,
                }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1, display: 'flex' }}>
              <Icon size={22} />
            </span>
            <span
              style={{
                position: 'relative',
                zIndex: 1,
                fontSize: '0.72rem',
                fontWeight: 800,
                marginTop: '3px',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
