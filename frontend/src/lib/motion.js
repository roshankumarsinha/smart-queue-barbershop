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

// Tile reveal: a punchier grid/stack entrance for big action tiles and shop
// cards — items rise + scale in on a spring so they settle with a light
// overshoot (see ui-ux-pro-max "Stagger List / Standard"). Pair `tileGrid` on
// the wrapper with `tileItem` on each child.
export const tileGrid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};

export const tileItem = {
  hidden: { opacity: 0, y: 18, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 380, damping: 26 },
  },
};
