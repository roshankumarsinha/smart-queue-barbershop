import { forwardRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/*
 * Brass-gleam call-to-action button.
 *
 * A conic "spark" travels around the perimeter for a metallic gleam, layered
 * under the label. The perimeter-spark technique is adapted from the
 * 21st.dev / magicui Shimmer Button (retrieved via the 21st Magic MCP server)
 * and retuned to Smart Queue's brass palette; the two driving keyframes
 * (`shimmer-slide`, `spin-around`) live in tailwind.config.js.
 *
 * It's a plain <button> (not MUI) so it can own its background + overflow, and
 * wraps framer-motion for a springy press. Callers style the label via
 * children and pass width/padding through className.
 */
const ShimmerButton = forwardRef(function ShimmerButton(
  {
    children,
    className = '',
    shimmerColor = '#F3ECDF',
    shimmerDuration = '2.8s',
    borderRadius = '14px',
    disabled = false,
    ...props
  },
  ref,
) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      whileHover={disabled ? undefined : { scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={{
        '--spread': '90deg',
        '--shimmer-color': shimmerColor,
        '--radius': borderRadius,
        '--speed': shimmerDuration,
        '--cut': '0.06em',
        borderRadius,
      }}
      className={
        'group relative z-0 flex cursor-pointer items-center justify-center gap-2 ' +
        'overflow-hidden whitespace-nowrap px-6 py-3.5 font-signage font-semibold ' +
        'uppercase tracking-[0.08em] text-ink transition-transform ' +
        'disabled:cursor-not-allowed disabled:opacity-60 ' +
        className
      }
      {...props}
    >
      {/* Brass base + a soft top-down sheen so it reads as polished metal. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-30"
        style={{
          background:
            'linear-gradient(180deg,#E7C56B 0%,#C89B3C 45%,#A67C2E 100%)',
          borderRadius,
        }}
      />

      {/* Travelling gleam (skipped when the user prefers reduced motion). */}
      {!reduce && (
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-20 overflow-visible blur-[2px] [container-type:size]"
        >
          <span className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1]">
            <span className="animate-spin-around absolute -inset-full w-auto [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]" />
          </span>
        </span>
      )}

      {/* Inner backdrop (leaves the gleam showing only as a hairline edge). */}
      <span
        aria-hidden="true"
        className="absolute -z-10"
        style={{
          inset: 'var(--cut)',
          borderRadius,
          background:
            'linear-gradient(180deg,#E7C56B 0%,#C89B3C 46%,#A67C2E 100%)',
        }}
      />

      {/* Inset highlight for a pressed/embossed feel. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-8px_12px_rgba(90,60,10,0.25)] transition-shadow duration-300 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-6px_12px_rgba(90,60,10,0.3)] group-active:shadow-[inset_0_2px_8px_rgba(90,60,10,0.4)]"
        style={{ borderRadius }}
      />

      {children}
    </motion.button>
  );
});

export default ShimmerButton;
