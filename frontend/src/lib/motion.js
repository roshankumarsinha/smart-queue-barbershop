// Shared Framer Motion variants.

// Stagger: children animate in slightly after one another (dashboard stat cards
// and permission lists). Apply `staggerContainer` to the wrapper with
// initial="hidden" animate="show", and `staggerItem` to each child.
export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
};
