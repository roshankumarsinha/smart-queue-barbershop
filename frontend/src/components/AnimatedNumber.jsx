import { useEffect } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
} from 'framer-motion';

/*
 * Rolls a number up/down to its new value with a spring, instead of snapping.
 * Used by the queue stat tiles so a changing count (in-queue, ETA) feels alive.
 * `suffix` (e.g. "m") is appended after the rounded value. Respects
 * prefers-reduced-motion by jumping straight to the value.
 */
export default function AnimatedNumber({ value, suffix = '', className }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const rounded = useTransform(mv, (v) => `${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      type: 'spring',
      stiffness: 120,
      damping: 18,
    });
    return () => controls.stop();
  }, [value, mv, reduce]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
