import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playPop, playVictoryFanfare } from '../../utils/soundEffects';
import '../../styles/duolingo.css';
import { useGame } from '../../store/GameContext';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose }) => {
  const { profile, buyShopItem, selectSkin, refillHearts, state } = useGame();

  if (!isOpen) return null;

  const skins = [
    { id: 'default', name: 'SudoBuddy', icon: '/mascot.jpg', cost: 0, desc: 'Klassisches Maskottchen' },
    { id: 'fox', name: 'Schlauer Fuchs', icon: '/mascot_fox.jpg', cost: 300, desc: 'Mit scharfer Brille für Mathe-Genies' },
    { id: 'king', name: 'König Sudo', icon: '/mascot_king.jpg', cost: 500, desc: 'Königlicher Look mit goldener Krone' },
    { id: 'ninja', name: 'Zahlen Ninja', icon: '/mascot_ninja.jpg', cost: 750, desc: 'Lautlos & blitzschnell beim Lösen' },
  ];

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px'
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '24px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
            border: '4px solid var(--duo-gray)',
            fontFamily: "'Nunito', sans-serif"
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, color: 'var(--duo-text-dark)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5rem' }}>
              🛒 Duolingo Shop
            </h2>
            <div style={{
              backgroundColor: '#fff4cc',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '2px solid var(--duo-yellow-shadow)',
              fontWeight: 800,
              color: '#d48800',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              💎 {profile.gems} Edelsteine
            </div>
          </div>

          <p style={{ color: 'var(--duo-text-light)', margin: '0 0 20px 0', fontSize: '0.9rem' }}>
            Löse Sudokus schnell, halte deine Streak und verdiene Edelsteine für Power-Ups & Skins!
          </p>

          {/* Power-Ups Section */}
          <h3 style={{ margin: '16px 0 12px 0', color: 'var(--duo-text-dark)', fontSize: '1.1rem' }}>⚡ Power-Ups</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {/* Hearts Refill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '16px',
              backgroundColor: 'var(--duo-bg-light)',
              border: '2px solid var(--duo-gray)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>❤️</span>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--duo-text-dark)' }}>Herzen auffüllen</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--duo-text-light)' }}>
                    {state?.lives === 3 ? 'Leben sind voll' : `Aktuell: ${state?.lives ?? 3}/3 Herzen`}
                  </div>
                </div>
              </div>
              <button
                className={`btn-duo ${state?.lives === 3 || profile.gems < 50 ? 'btn-duo-disabled' : 'btn-duo-red'}`}
                disabled={state?.lives === 3 || profile.gems < 50}
                onClick={() => {
                  if (buyShopItem('hearts', 50)) {
                    refillHearts();
                    playVictoryFanfare();
                  }
                }}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                💎 50
              </button>
            </div>

            {/* Hint Pack */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '16px',
              backgroundColor: 'var(--duo-bg-light)',
              border: '2px solid var(--duo-gray)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>💡</span>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--duo-text-dark)' }}>3x Tipps</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--duo-text-light)' }}>
                    Aktuell: {profile.hints} Tipps übrig
                  </div>
                </div>
              </div>
              <button
                className={`btn-duo ${profile.gems < 100 ? 'btn-duo-disabled' : 'btn-duo-yellow'}`}
                disabled={profile.gems < 100}
                onClick={() => {
                  if (buyShopItem('hints', 100)) {
                    playVictoryFanfare();
                  }
                }}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                💎 100
              </button>
            </div>

            {/* Streak Freeze */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderRadius: '16px',
              backgroundColor: 'var(--duo-bg-light)',
              border: '2px solid var(--duo-gray)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>🛡️</span>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--duo-text-dark)' }}>Streak-Schutz</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--duo-text-light)' }}>
                    Schützt deine Serie für 1 verpassten Tag ({profile.streakFreeze} aktiv)
                  </div>
                </div>
              </div>
              <button
                className={`btn-duo ${profile.gems < 150 ? 'btn-duo-disabled' : 'btn-duo-blue'}`}
                disabled={profile.gems < 150}
                onClick={() => {
                  if (buyShopItem('streakFreeze', 150)) {
                    playVictoryFanfare();
                  }
                }}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                💎 150
              </button>
            </div>
          </div>

          {/* Skins Section */}
          <h3 style={{ margin: '16px 0 12px 0', color: 'var(--duo-text-dark)', fontSize: '1.1rem' }}>🎭 Maskottchen-Skins</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {skins.map(skin => {
              const isUnlocked = profile.unlockedSkins.includes(skin.id);
              const isEquipped = profile.selectedMascotSkin === skin.id;

              return (
                <div
                  key={skin.id}
                  style={{
                    border: isEquipped ? '3px solid var(--duo-green)' : '2px solid var(--duo-gray)',
                    borderRadius: '16px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: isEquipped ? '#eefbdf' : 'white',
                    position: 'relative'
                  }}
                >
                  <img
                    src={skin.icon}
                    alt={skin.name}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--duo-gray)',
                      marginBottom: '8px'
                    }}
                  />
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--duo-text-dark)', textAlign: 'center' }}>
                    {skin.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--duo-text-light)', textAlign: 'center', margin: '4px 0 8px 0', height: '28px' }}>
                    {skin.desc}
                  </div>

                  {isEquipped ? (
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--duo-green)' }}>
                      ✓ Ausgerüstet
                    </span>
                  ) : isUnlocked ? (
                    <button
                      className="btn-duo"
                      onClick={() => {
                        playPop();
                        selectSkin(skin.id as any);
                      }}
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      Ausrüsten
                    </button>
                  ) : (
                    <button
                      className={`btn-duo ${profile.gems < skin.cost ? 'btn-duo-disabled' : 'btn-duo-purple'}`}
                      disabled={profile.gems < skin.cost}
                      onClick={() => {
                        if (buyShopItem(`skin_${skin.id}`, skin.cost)) {
                          selectSkin(skin.id as any);
                          playVictoryFanfare();
                        }
                      }}
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      💎 {skin.cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Close Button */}
          <button
            className="btn-duo btn-duo-gray"
            onClick={() => {
              playPop();
              onClose();
            }}
            style={{ width: '100%', marginTop: '12px' }}
          >
            Schließen
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
