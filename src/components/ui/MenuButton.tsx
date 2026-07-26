import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import '../../styles/variables.css';

interface MenuButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const MenuButton: React.FC<MenuButtonProps> = ({ children, variant = 'primary', onClick, ...props }) => {
  
  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");
    
    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) ripple.remove();
    button.appendChild(circle);

    if (onClick) {
      onClick(event);
    }
  };

  const baseStyle: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--border-glass)',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    color: 'var(--text-main)',
    background: variant === 'primary' ? 'var(--accent-gradient)' : 'var(--bg-card)',
    boxShadow: variant === 'primary' ? '0 4px 15px var(--accent-glow)' : 'var(--glass-shadow)',
  };

  return (
    <motion.button
      className="btn-interactive"
      style={baseStyle}
      onClick={createRipple}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};
