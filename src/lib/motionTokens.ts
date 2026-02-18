import type { Transition } from "framer-motion";

/**
 * Motion token system for Tenuto.io v2.1
 *
 * Spring presets for Framer Motion transitions.
 * Usage: <motion.div transition={snappy} animate={{ opacity: 1 }} />
 *
 * Components are responsible for checking useReducedMotion()
 * when applying these presets. The CSS prefers-reduced-motion
 * media query in index.css handles CSS animations; these spring
 * presets handle JS-driven Framer Motion animations.
 */

/** Fast, decisive — buttons, toggles, small UI elements */
export const snappy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

/** Natural, balanced — cards, panels, page sections */
export const smooth: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 25,
  mass: 1,
};

/** Playful, attention-drawing — success states, badges, celebrations */
export const bouncy: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 15,
  mass: 1,
};

/** Duration values in seconds for non-spring (ease) transitions */
export const duration = {
  instant: 0.05,
  fast: 0.15,     // page transitions (per v2.0 user decision)
  normal: 0.20,   // toasts, modals, slide panels (per v2.0 user decision)
  slow: 0.35,
} as const;

/** Named easing strings for CSS/Framer ease transitions */
export const easing = {
  easeOut: "ease-out",
  easeIn: "ease-in",
  easeInOut: "ease-in-out",
  sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
} as const;
