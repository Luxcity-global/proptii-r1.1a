import type { Variants, Transition } from 'framer-motion';

// Common animation variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const slideInFromTop: Variants = {
  hidden: { opacity: 0, y: -50 },
  visible: { opacity: 1, y: 0 },
};

export const slideInFromBottom: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
};

export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 },
};

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -180 },
  visible: { opacity: 1, rotate: 0 },
};

// Stagger animations for lists
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Hover animations
export const hoverScale: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

export const hoverLift: Variants = {
  rest: { y: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' },
  hover: { 
    y: -4, 
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    transition: { duration: 0.2 }
  },
};

// Page transitions
export const pageTransition: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const modalTransition: Variants = {
  initial: { opacity: 0, scale: 0.8, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.8, y: 20 },
};

// Loading animations
export const pulse: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const spin: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// Common transition configurations
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const smoothTransition: Transition = {
  duration: 0.3,
  ease: 'easeInOut',
};

export const quickTransition: Transition = {
  duration: 0.15,
  ease: 'easeOut',
};

export const slowTransition: Transition = {
  duration: 0.6,
  ease: 'easeInOut',
};

// Animation presets for common use cases
export const animationPresets = {
  // Card animations
  cardHover: {
    variants: hoverLift,
    transition: smoothTransition,
  },
  
  // Button animations
  buttonPress: {
    variants: hoverScale,
    transition: quickTransition,
  },
  
  // List animations
  listStagger: {
    container: staggerContainer,
    item: staggerItem,
    transition: smoothTransition,
  },
  
  // Page animations
  pageSlide: {
    variants: pageTransition,
    transition: smoothTransition,
  },
  
  // Modal animations
  modalSlide: {
    variants: modalTransition,
    transition: springTransition,
  },
  
  // Loading animations
  loadingPulse: {
    variants: pulse,
  },
  
  loadingSpin: {
    variants: spin,
  },
};

// Utility function to create custom variants
export const createVariants = (
  hidden: Record<string, any>,
  visible: Record<string, any>
): Variants => ({
  hidden,
  visible,
});

// Utility function to create staggered variants
export const createStaggerVariants = (
  itemVariants: Variants,
  staggerDelay: number = 0.1
): { container: Variants; item: Variants } => ({
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: staggerDelay,
      },
    },
  },
  item: itemVariants,
});
