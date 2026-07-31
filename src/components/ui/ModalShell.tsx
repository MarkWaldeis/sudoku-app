import React, { useEffect, useId } from 'react';
import { motion } from 'framer-motion';
import { CloseIcon } from './icons';
import { playPop } from '../../utils/soundEffects';
import { hapticTap } from '../../utils/haptics';

interface ModalShellProps {
  onClose: () => void;
  titleId?: string;
  maxWidth?: number;
  children: React.ReactNode;
  /** Hide the built-in close button (e.g. blocking dialogs). */
  hideCloseButton?: boolean;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Shared premium modal surface: frosted backdrop, safe-area aware, centered
 * scale-in entrance (150–200ms, ease-out), Escape + backdrop-click dismissal,
 * full ARIA dialog semantics. Only one modal should be mounted at a time.
 */
export const ModalShell: React.FC<ModalShellProps> = ({
  onClose,
  titleId,
  maxWidth = 420,
  children,
  hideCloseButton = false,
}) => {
  const autoId = useId();
  const labelledBy = titleId ?? autoId;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <motion.div
      className="duo-backdrop"
      style={{ zIndex: 2000 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      onClick={() => {
        playPop();
        hapticTap();
        onClose();
      }}
    >
      <motion.div
        className="duo-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        style={{ maxWidth, position: 'relative', maxHeight: 'calc(100dvh - 48px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideCloseButton && (
          <button
            onClick={() => {
              playPop();
              hapticTap();
              onClose();
            }}
            aria-label="Schließen"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              color: 'var(--duo-text-light)',
              zIndex: 2,
              transition: 'transform 120ms var(--ease-out), color 120ms var(--ease-out)',
            }}
            onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
            onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <CloseIcon size={20} />
          </button>
        )}
        <div
          style={{
            maxHeight: 'calc(100dvh - 48px)',
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};
