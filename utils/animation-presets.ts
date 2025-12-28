/**
 * Animation Presets
 *
 * Standardized Framer Motion variants matching Quant Matrix design system.
 * All timings align with existing patterns for consistency.
 */

import { Variants, Transition } from 'framer-motion';

/**
 * Standard timing constants (matching existing patterns)
 */
export const TIMINGS = {
  PANEL_SLIDE: 0.3,      // 300ms
  FADE: 0.2,             // 200ms
  VALUE_MORPH: 0.5,      // 500ms
  CAMERA_MOVE: 0.8,      // 800ms
  DRAW_LINE: 2.0,        // 2s
  STAGGER_DELAY: 0.05,   // 50ms
} as const;

/**
 * Standard easing functions
 */
export const EASINGS = {
  TWEEN: [0.4, 0.0, 0.2, 1],           // Standard ease-out
  EASE: [0.25, 0.1, 0.25, 1],          // General ease
  EASE_IN_OUT: [0.42, 0, 0.58, 1],     // Smooth both ends
  EASE_OUT: [0, 0, 0.2, 1],            // Sharp start, smooth end
  SPRING_DEFAULT: { type: 'spring', stiffness: 500, damping: 28 },
} as const;

/**
 * Panel slide-in from bottom
 * Usage: Panel components (BacktestPanel, PriceChartPanel, etc.)
 */
export const panelSlideUp: Variants = {
  hidden: {
    y: '100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: TIMINGS.PANEL_SLIDE,
      ease: EASINGS.TWEEN,
    },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: {
      duration: TIMINGS.PANEL_SLIDE * 0.8, // Slightly faster exit
      ease: EASINGS.TWEEN,
    },
  },
};

/**
 * Panel slide-in from right
 * Usage: Side panels, settings
 */
export const panelSlideLeft: Variants = {
  hidden: {
    x: '100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: TIMINGS.PANEL_SLIDE,
      ease: EASINGS.TWEEN,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: TIMINGS.PANEL_SLIDE * 0.8,
      ease: EASINGS.TWEEN,
    },
  },
};

/**
 * Simple fade in/out
 * Usage: Overlays, tooltips, general UI elements
 */
export const fade: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: TIMINGS.FADE,
      ease: EASINGS.EASE,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: TIMINGS.FADE,
      ease: EASINGS.EASE,
    },
  },
};

/**
 * Scale with spring
 * Usage: Buttons, interactive elements
 */
export const scaleSpring: Variants = {
  initial: {
    scale: 0.95,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: EASINGS.SPRING_DEFAULT,
  },
  tap: {
    scale: 0.95,
  },
  hover: {
    scale: 1.05,
  },
};

/**
 * Rise from below with fade
 * Usage: Block creation, list items
 */
export const riseUp: Variants = {
  hidden: {
    y: 20,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: TIMINGS.PANEL_SLIDE,
      ease: EASINGS.EASE_OUT,
    },
  },
};

/**
 * Stagger container for children
 * Usage: Lists, grids, sequential reveals
 */
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: TIMINGS.STAGGER_DELAY,
      delayChildren: 0,
    },
  },
};

/**
 * Stagger item (child of staggerContainer)
 */
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: TIMINGS.FADE,
      ease: EASINGS.EASE,
    },
  },
};

/**
 * Draw line animation (path reveal)
 * Usage: Connectors, equity curves, paths
 */
export const drawLine = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: TIMINGS.DRAW_LINE,
        ease: EASINGS.EASE,
      },
      opacity: {
        duration: TIMINGS.FADE,
        ease: EASINGS.EASE,
      },
    },
  },
};

/**
 * Value morphing animation
 * Usage: Number counters, data updates
 */
export const valueMorph: Variants = {
  initial: (custom: number) => ({
    opacity: 1,
  }),
  animate: (custom: number) => ({
    opacity: 1,
    transition: {
      duration: TIMINGS.VALUE_MORPH,
      ease: EASINGS.EASE_IN_OUT,
    },
  }),
};

/**
 * 3D object entrance (from below)
 * Usage: 3D visualizations appearing in scene
 */
export const object3DEnter: Variants = {
  hidden: {
    y: -2,
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: TIMINGS.CAMERA_MOVE,
      ease: EASINGS.EASE_OUT,
    },
  },
};

/**
 * Expand/collapse for collapsible sections
 * Usage: Accordion panels, expandable details
 */
export const expandCollapse: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    overflow: 'visible',
    transition: {
      height: {
        duration: TIMINGS.PANEL_SLIDE,
        ease: EASINGS.EASE_IN_OUT,
      },
      opacity: {
        duration: TIMINGS.FADE,
        ease: EASINGS.EASE,
      },
    },
  },
};

/**
 * Glow pulse effect
 * Usage: Active indicators, notifications
 */
export const glowPulse: Variants = {
  initial: {
    boxShadow: '0 0 0px rgba(0, 255, 157, 0)',
  },
  animate: {
    boxShadow: [
      '0 0 0px rgba(0, 255, 157, 0)',
      '0 0 20px rgba(0, 255, 157, 0.6)',
      '0 0 0px rgba(0, 255, 157, 0)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Slide and fade for tooltips
 * Usage: Hover tooltips, contextual info
 */
export const tooltip: Variants = {
  hidden: {
    y: 5,
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: TIMINGS.FADE,
      ease: EASINGS.EASE_OUT,
    },
  },
};

/**
 * Create custom transition with standard easing
 * @param duration - Duration in seconds
 * @param ease - Easing function name
 * @returns Transition object
 */
export function createTransition(
  duration: number = TIMINGS.PANEL_SLIDE,
  ease: keyof typeof EASINGS = 'TWEEN'
): Transition {
  const easingValue = EASINGS[ease];

  if (Array.isArray(easingValue)) {
    return {
      duration,
      ease: easingValue,
    };
  }

  return easingValue;
}

/**
 * Create stagger transition
 * @param staggerDelay - Delay between children
 * @param childDuration - Duration for each child
 * @returns Transition with stagger
 */
export function createStagger(
  staggerDelay: number = TIMINGS.STAGGER_DELAY,
  childDuration: number = TIMINGS.FADE
): Transition {
  return {
    staggerChildren: staggerDelay,
    delayChildren: 0,
  };
}
