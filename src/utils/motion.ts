import type { Variants, Transition } from 'motion/react';

// Signature cinematic Dribbble easing curve: cubic-bezier(0.16, 1, 0.3, 1)
// Provides silky momentum damping, cushioned landing, and high-end feel.
export const smoothEase = [0.16, 1, 0.3, 1] as const;
export const luxuryEase = smoothEase; // Backward compatibility alias

// Fast micro-interaction transition (buttons, badges, icons)
export const transitionQuick: Transition = {
  duration: 0.18,
  ease: smoothEase,
};

// Standard UI element transition (panels, drawers, tabs)
export const transitionStandard: Transition = {
  duration: 0.32,
  ease: smoothEase,
};

// Deeper, cinematic panel transition
export const transitionPanel: Transition = {
  duration: 0.44,
  ease: smoothEase,
};

// Fluid Page and View transitions with zero layout shift
export const pageMotion: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.992 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.38,
      ease: smoothEase,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.995,
    transition: {
      duration: 0.22,
      ease: smoothEase,
    },
  },
};

// Staggered Container for Grids, KPI Rows, and Candidate Cards
export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.03,
    },
  },
};

// Faster stagger for dense lists
export const staggerContainerFast: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.015,
    },
  },
};

// Stagger Item (Smooth vertical lift + scale + opacity reveal)
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 14, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.36,
      ease: smoothEase,
    },
  },
};

// Simple card entrance
export const cardMotion: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.988 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.34,
      ease: smoothEase,
    },
  },
};

// 3D Hover Elevation for Dashboard Cards
export const cardHover3dProps = {
  whileHover: {
    y: -4,
    scale: 1.008,
    transition: { duration: 0.24, ease: smoothEase },
  },
  whileTap: {
    y: -1,
    scale: 0.995,
    transition: { duration: 0.12, ease: smoothEase },
  },
};

// Fast instant hover card transition fallback
export const hoverCardTransition: Transition = {
  duration: 0.24,
  ease: smoothEase,
};

// Modal Backdrop (Deep cinematic dark blur)
export const modalBackdropMotion: Variants = {
  initial: { opacity: 0, backdropFilter: 'blur(0px)' },
  animate: {
    opacity: 1,
    backdropFilter: 'blur(8px)',
    transition: {
      duration: 0.28,
      ease: smoothEase,
    },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: 0.2,
      ease: smoothEase,
    },
  },
};

// Modal Content Dialog (Smooth scale up inspired by Dribbble "Performance test" modal)
export const modalContentMotion: Variants = {
  initial: { opacity: 0, scale: 0.94, y: 12 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.34,
      ease: smoothEase,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: {
      duration: 0.2,
      ease: smoothEase,
    },
  },
};

// Slide-out Drawer (Side Alerts / Notifications)
export const drawerMotion: Variants = {
  initial: { x: '100%', opacity: 0.4 },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.38,
      ease: smoothEase,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: 0.26,
      ease: smoothEase,
    },
  },
};

// Dropdown Popovers
export const dropdownMotion: Variants = {
  initial: { opacity: 0, y: -6, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.24,
      ease: smoothEase,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.98,
    transition: {
      duration: 0.16,
      ease: smoothEase,
    },
  },
};

// Alert Toasts
export const toastMotion: Variants = {
  initial: { opacity: 0, y: 10, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.32,
      ease: smoothEase,
    },
  },
  exit: {
    opacity: 0,
    y: 6,
    scale: 0.98,
    transition: {
      duration: 0.18,
      ease: smoothEase,
    },
  },
};

// Interactive Button Press Micro-Feedback
export const buttonTapProps = {
  whileHover: { scale: 1.015, y: -1 },
  whileTap: { scale: 0.985, y: 0 },
  transition: { duration: 0.16, ease: smoothEase },
};
