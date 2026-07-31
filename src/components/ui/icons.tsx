import React from 'react';

/**
 * Custom game icon set.
 * Construction rules: 24×24 viewBox, outlined linear style, 1.8px stroke,
 * round caps/joins, currentColor only – no fills, no gradients, no shadows.
 * Sizes are applied by the host component via the `size` prop (default 20).
 */

export interface IconProps {
  size?: number;
  className?: string;
  /** Decorative by default; pass a label for standalone icon buttons. */
  ariaLabel?: string;
}

const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({
  size = 20,
  className,
  ariaLabel,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={ariaLabel ? 'img' : undefined}
    aria-label={ariaLabel}
    aria-hidden={ariaLabel ? undefined : true}
    style={{ display: 'block', flexShrink: 0 }}
  >
    {children}
  </svg>
);

export const MapIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z" />
    <path d="M9 4v14" />
    <path d="M15 6v14" />
  </Svg>
);

export const BoltIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" />
  </Svg>
);

export const SkullIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 3a7 7 0 0 0-7 7c0 2.6 1.4 4.4 3 5.4V19a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-3.6c1.6-1 3-2.8 3-5.4a7 7 0 0 0-7-7Z" />
    <circle cx="9.2" cy="10.5" r="0.4" fill="currentColor" />
    <circle cx="14.8" cy="10.5" r="0.4" fill="currentColor" />
    <path d="M10.5 21v-2.2" />
    <path d="M13.5 21v-2.2" />
  </Svg>
);

export const CartIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M3 4h2.2l2 12h10.6l2-8H7" />
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="16" cy="20" r="1.4" />
  </Svg>
);

export const ChartIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 4v15a1 1 0 0 0 1 1h15" />
    <path d="M8 16v-5" />
    <path d="M12 16V8" />
    <path d="M16 16v-3" />
  </Svg>
);

export const TrophyIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
    <path d="M8 5H5a3 3 0 0 0 3 4" />
    <path d="M16 5h3a3 3 0 0 1-3 4" />
    <path d="M12 13v3" />
    <path d="M8.5 20h7" />
    <path d="M10 16h4l.8 4H9.2L10 16Z" />
  </Svg>
);

export const HeartIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 20s-7.5-4.6-9.3-9A5.2 5.2 0 0 1 12 6.4 5.2 5.2 0 0 1 21.3 11c-1.8 4.4-9.3 9-9.3 9Z" />
  </Svg>
);

export const GemIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M7 3h10l4 6-9 12L3 9l4-6Z" />
    <path d="M3 9h18" />
    <path d="M9.5 3 8 9l4 12" />
    <path d="M14.5 3 16 9l-4 12" />
  </Svg>
);

export const FlameIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 21a6 6 0 0 0 6-6c0-2.5-1.5-4.5-3-6.5C13.5 6.5 13 4.5 13 2c-3 2-4.5 4.7-4.5 7.5 0 0-1.5-1-2-3-1 1.6-1.5 3.5-1.5 5A6.5 6.5 0 0 0 12 21Z" />
    <path d="M12 21a3.5 3.5 0 0 1-3.5-3.5c0-1.5 1-2.8 3.5-4.5 2.5 1.7 3.5 3 3.5 4.5A3.5 3.5 0 0 1 12 21Z" />
  </Svg>
);

export const BulbIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.8.6 1.5 1.6 1.5 2.6v.5h4v-.5c0-1 .7-2 1.5-2.6A6 6 0 0 0 12 3Z" />
    <path d="M10 20h4" />
    <path d="M10.8 22h2.4" />
  </Svg>
);

export const NotesIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z" />
    <path d="M14.5 6.5l3 3" />
  </Svg>
);

export const BackspaceIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M8 5h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8l-5-7 5-7Z" />
    <path d="M11 10l5 5" />
    <path d="M16 10l-5 5" />
  </Svg>
);

export const UndoIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M8 5 3 10l5 5" />
    <path d="M3 10h10a6 6 0 0 1 6 6v1" />
  </Svg>
);

export const RedoIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="m16 5 5 5-5 5" />
    <path d="M21 10H11a6 6 0 0 0-6 6v1" />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Svg>
);

export const CloseIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </Svg>
);

export const CrownIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 18h16" />
    <path d="M4 16 2.5 7 8 10.5 12 4l4 6.5L21.5 7 20 16H4Z" />
  </Svg>
);

export const LockIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    <path d="M12 14.5v2" />
  </Svg>
);

export const StarIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1L3.2 9.4l6.1-.8L12 3Z" />
  </Svg>
);

export const ShieldIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 3 5 5.5v6c0 4.5 3 7.6 7 9.5 4-1.9 7-5 7-9.5v-6L12 3Z" />
    <path d="m9 11.5 2.2 2.2L15.5 9.5" />
  </Svg>
);

export const TimerIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="13" r="7.5" />
    <path d="M12 9.5V13l2.5 1.5" />
    <path d="M9.5 2.5h5" />
  </Svg>
);

export const PartyIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M5 15 3 21l6-2-4-4Z" />
    <path d="m5 15 1.8-.4M6.7 17l2-.5" />
    <path d="M13 4c.8.5 1.6.6 2.5.3" />
    <path d="M16.5 8c.8.5 1.6.6 2.5.3" />
    <path d="M14 11.5c2-.2 3.5-1.5 4-3.5" />
    <circle cx="18.5" cy="4.5" r="0.4" fill="currentColor" />
    <circle cx="20" cy="10" r="0.4" fill="currentColor" />
    <circle cx="12.5" cy="7.5" r="0.4" fill="currentColor" />
  </Svg>
);
