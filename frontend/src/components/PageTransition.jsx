import { motion } from 'framer-motion';

// Wraps a route-level screen so it animates in/out under <AnimatePresence>
// (see App.jsx). Quick fade + slight vertical slide — the login <-> dashboard
// transition. Kept short so it never feels like it blocks the user.
const variants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
