import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { playPop, playVictoryFanfare } from '../../utils/soundEffects';
import { hapticTap, hapticSuccess, hapticError } from '../../utils/haptics';
import { useGame } from '../../store/GameContext';
import { ModalShell } from './ModalShell';
import { CartIcon, HeartIcon, BulbIcon, ShieldIcon, GemIcon, BoltIcon } from './icons';
import { MASCOT_SKINS } from '../../logic/skins';
import '../../styles/duolingo.css';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const itemCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '14px',
  borderRadius: '16px',
  backgroundColor: 'var(--duo-bg-light)',
  border: '2px solid var(--duo-gray)',
};

const iconBadge = (bg: string, color: string): React.CSSProperties => ({
  width: '48px',
  height: '48px',
  borderRadius: '14px',
  backgroundColor: bg,
  color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose }) => {
  const { profile, buyShopItem, selectSkin, refillHearts, state } = useGame();

  const base = import.meta.env.BASE_URL;
  const skins = MASCOT_SKINS;

  const handleBuy = (itemId: string, cost: number, after?: () => void) => {
    if (buyShopItem(itemId, cost)) {
      playVictoryFanfare();
      hapticSuccess();
      after?.();
    } else {
      playPop();
      hapticError();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalShell onClose={onClose} maxWidth={480}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px', paddingRight: '40px' }}>
            <h2
              style={{
                margin: 0,
                color: 'var(--duo-text-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '1.4rem',
                fontWeight: 900,
              }}
            >
              <span style={{ color: 'var(--duo-yellow-shadow)', display: 'inline-flex' }}>
                <CartIcon size={26} />
              </span>
              Shop
            </h2>
            <div
              style={{
                backgroundColor: '#fff4cc',
                padding: '8px 14px',
                borderRadius: '20px',
                border: '2px solid var(--duo-yellow-shadow)',
                fontWeight: 800,
                color: '#d48800',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '36px',
              }}
              aria-label={`${profile.gems} Edelsteine`}
            >
              <GemIcon size={18} />
              {profile.gems}
            </div>
          </div>

          <p style={{ color: 'var(--duo-text-light)', margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 600 }}>
            Löse Sudokus schnell, halte deine Streak und verdiene Edelsteine für Power-Ups & Skins!
          </p>

          {/* Power-Ups Section */}
          <h3 style={{ margin: '16px 0 12px 0', color: 'var(--duo-text-dark)', fontSize: '1.05rem', fontWeight: 900 }}>
            Power-Ups
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {/* Hearts Refill */}
            <motion.div style={itemCard} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={iconBadge('#ffe5e5', 'var(--duo-red)')}>
                  <HeartIcon size={24} />
                </span>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--duo-text-dark)' }}>Herzen auffüllen</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--duo-text-light)', fontWeight: 600 }}>
                    {(state?.lives ?? 3) >= 3 ? 'Leben sind voll' : `Aktuell: ${state?.lives ?? 3}/3 Herzen`}
                  </div>
                </div>
              </div>
              <button
                className={`btn-duo ${(state?.lives ?? 3) >= 3 || profile.gems < 50 ? 'btn-duo-disabled' : 'btn-duo-red'}`}
                disabled={(state?.lives ?? 3) >= 3 || profile.gems < 50}
                onClick={() => handleBuy('hearts', 50, refillHearts)}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <GemIcon size={16} /> 50
              </button>
            </motion.div>

            {/* Hint Pack */}
            <motion.div style={itemCard} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05, ease: [0.23, 1, 0.32, 1] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={iconBadge('#fff4cc', '#d48800')}>
                  <BulbIcon size={24} />
                </span>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--duo-text-dark)' }}>3x Tipps</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--duo-text-light)', fontWeight: 600 }}>
                    Aktuell: {profile.hints} Tipps übrig
                  </div>
                </div>
              </div>
              <button
                className={`btn-duo ${profile.gems < 100 ? 'btn-duo-disabled' : 'btn-duo-yellow'}`}
                disabled={profile.gems < 100}
                onClick={() => handleBuy('hints', 100)}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <GemIcon size={16} /> 100
              </button>
            </motion.div>

            {/* Streak Freeze */}
            <motion.div style={itemCard} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={iconBadge('#e5f6ff', 'var(--duo-blue)')}>
                  <ShieldIcon size={24} />
                </span>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--duo-text-dark)' }}>Streak-Schutz</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--duo-text-light)', fontWeight: 600 }}>
                    Schützt deine Serie für 1 verpassten Tag ({profile.streakFreeze} aktiv)
                  </div>
                </div>
              </div>
              <button
                className={`btn-duo ${profile.gems < 150 ? 'btn-duo-disabled' : 'btn-duo-blue'}`}
                disabled={profile.gems < 150}
                onClick={() => handleBuy('streakFreeze', 150)}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <GemIcon size={16} /> 150
              </button>
            </motion.div>

            {/* Extra Heart */}
            <motion.div style={itemCard} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={iconBadge('#ffe5f0', '#e64980')}>
                  <HeartIcon size={24} />
                </span>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--duo-text-dark)' }}>Extra-Herz</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--duo-text-light)', fontWeight: 600 }}>
                    {!state || state.isGameOver
                      ? 'Nur während eines laufenden Spiels'
                      : state.lives >= 4
                        ? 'Maximum erreicht (4/4)'
                        : `+1 Leben für dieses Spiel (${state.lives}/4)`}
                  </div>
                </div>
              </div>
              <button
                className={`btn-duo ${!state || state.isGameOver || state.lives >= 4 || profile.gems < 80 ? 'btn-duo-disabled' : 'btn-duo-red'}`}
                disabled={!state || state.isGameOver || state.lives >= 4 || profile.gems < 80}
                onClick={() => handleBuy('extraLife', 80)}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <GemIcon size={16} /> 80
              </button>
            </motion.div>

            {/* XP Boost */}
            <motion.div style={itemCard} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={iconBadge('#f3eaff', 'var(--duo-purple)')}>
                  <BoltIcon size={24} />
                </span>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--duo-text-dark)' }}>XP-Boost (2x)</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--duo-text-light)', fontWeight: 600 }}>
                    Doppelte XP im nächsten Sieg ({profile.xpBoostCharges} aktiv)
                  </div>
                </div>
              </div>
              <button
                className={`btn-duo ${profile.gems < 200 ? 'btn-duo-disabled' : 'btn-duo-purple'}`}
                disabled={profile.gems < 200}
                onClick={() => handleBuy('xpBoost', 200)}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <GemIcon size={16} /> 200
              </button>
            </motion.div>
          </div>

          {/* Skins Section */}
          <h3 style={{ margin: '16px 0 12px 0', color: 'var(--duo-text-dark)', fontSize: '1.05rem', fontWeight: 900 }}>
            Maskottchen-Skins
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '8px' }}>
            {skins.map((skin, i) => {
              const isUnlocked = profile.unlockedSkins.includes(skin.id);
              const isEquipped = profile.selectedMascotSkin === skin.id;

              return (
                <motion.div
                  key={skin.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.12 + i * 0.04, ease: [0.23, 1, 0.32, 1] }}
                  style={{
                    border: isEquipped ? '3px solid var(--duo-green)' : '2px solid var(--duo-gray)',
                    borderRadius: '16px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: isEquipped ? '#eefbdf' : 'white',
                    position: 'relative',
                    transition: 'border-color 150ms var(--ease-out), background-color 150ms var(--ease-out)',
                  }}
                >
                  {skin.emoji ? (
                    <span
                      aria-hidden="true"
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.4rem',
                        backgroundColor: 'var(--duo-bg-light)',
                        border: '2px solid var(--duo-gray)',
                        marginBottom: '8px',
                      }}
                    >
                      {skin.emoji}
                    </span>
                  ) : (
                    <img
                      src={`${base}${skin.image}`}
                      alt={skin.name}
                      width={64}
                      height={64}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--duo-gray)',
                        marginBottom: '8px',
                      }}
                    />
                  )}
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--duo-text-dark)', textAlign: 'center' }}>
                    {skin.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--duo-text-light)', textAlign: 'center', margin: '4px 0 8px 0', minHeight: '28px', fontWeight: 600 }}>
                    {skin.desc}
                  </div>

                  {isEquipped ? (
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--duo-green)', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
                      ✓ Ausgerüstet
                    </span>
                  ) : isUnlocked ? (
                    <button
                      className="btn-duo"
                      onClick={() => {
                        playPop();
                        hapticTap();
                        selectSkin(skin.id);
                      }}
                      style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                    >
                      Ausrüsten
                    </button>
                  ) : (
                    <button
                      className={`btn-duo ${profile.gems < skin.cost ? 'btn-duo-disabled' : 'btn-duo-purple'}`}
                      disabled={profile.gems < skin.cost}
                      onClick={() =>
                        handleBuy(`skin_${skin.id}`, skin.cost, () =>
                          selectSkin(skin.id)
                        )
                      }
                      style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                    >
                      <GemIcon size={14} /> {skin.cost}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </ModalShell>
      )}
    </AnimatePresence>
  );
};
