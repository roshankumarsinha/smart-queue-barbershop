import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { IconButton, Typography, Box } from '@mui/material';
import { X } from 'lucide-react';
import BarberPole from './BarberPole';

/*
 * A vintage "ticket stub" modal, built as a bespoke portal (not MUI Dialog) so it
 * owns its enter/exit choreography: the charcoal backdrop fades while the ivory
 * ticket drops in with a slight overshoot + tilt, and tears away downward on close.
 *
 * Accessibility: role=dialog + aria-modal, Escape closes, click-on-backdrop closes,
 * body scroll is locked while open, focus moves into the panel and is restored on
 * close. Respects prefers-reduced-motion (cross-fade only).
 */
function Perforation() {
  return (
    <Box sx={{ position: 'relative', py: 0.5 }}>
      <Box className="bg-charcoal" sx={notch(-0.5)} />
      <Box className="bg-charcoal" sx={notch(0.5, true)} />
      <Box sx={{ mx: 2, borderTop: '2px dashed', borderColor: 'rgba(107,93,79,0.3)' }} />
    </Box>
  );
}

const notch = (dir, right = false) => ({
  position: 'absolute',
  [right ? 'right' : 'left']: 0,
  top: '50%',
  width: 20,
  height: 20,
  transform: `translate(${dir * 100}%, -50%)`,
  borderRadius: '50%',
});

export default function TicketDialog({ open, onClose, title, subtitle, icon: Icon, children }) {
  const reduce = useReducedMotion();
  const panelRef = useRef(null);
  const lastFocused = useRef(null);

  // Keep the latest onClose in a ref so the focus/scroll-lock effect below can
  // depend on [open] alone. Depending on onClose (a fresh closure every render)
  // re-ran this effect on every keystroke, re-focusing the panel and yanking focus
  // out of the input — which dismisses the on-screen keyboard on mobile after each char.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    lastFocused.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e) {
      if (e.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', onKey);
    // Move focus into the panel once it has mounted.
    const t = setTimeout(() => panelRef.current?.focus(), 40);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
      lastFocused.current?.focus?.();
    };
  }, [open]);

  const panelInitial = reduce
    ? { opacity: 0 }
    : { opacity: 0, y: -28, scale: 0.94, rotate: -1.4 };
  const panelExit = reduce
    ? { opacity: 0 }
    : { opacity: 0, y: 40, scale: 0.96, rotate: 1 };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-charcoal/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Ticket panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-dialog-title"
            tabIndex={-1}
            initial={panelInitial}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={panelExit}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="relative z-10 my-auto w-full max-w-md overflow-hidden rounded-2xl outline-none"
            style={{
              background: '#F3ECDF',
              border: '1px solid rgba(200,155,60,0.28)',
              boxShadow: '0 30px 60px -18px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.4)',
            }}
          >
            <BarberPole className="h-2.5 w-full shrink-0" />

            <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                {Icon && (
                  <Box
                    component={motion.div}
                    initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ delay: 0.12, type: 'spring', stiffness: 300, damping: 18 }}
                    sx={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      color: 'primary.dark',
                      bgcolor: 'rgba(200,155,60,0.14)',
                      border: '1px solid rgba(200,155,60,0.35)',
                    }}
                  >
                    <Icon size={22} aria-hidden="true" />
                  </Box>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    id="ticket-dialog-title"
                    className="font-display"
                    sx={{ fontSize: 30, lineHeight: 1.05, color: 'text.primary', letterSpacing: '0.01em' }}
                  >
                    {title}
                  </Typography>
                  {subtitle && (
                    <Typography sx={{ mt: 0.25, fontSize: 13, color: 'text.secondary' }}>
                      {subtitle}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  onClick={onClose}
                  aria-label="Close"
                  size="small"
                  component={motion.button}
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ rotate: 90 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  sx={{ color: 'text.secondary', '&:hover': { color: 'secondary.main', bgcolor: 'transparent' } }}
                >
                  <X size={20} />
                </IconButton>
              </Box>
            </Box>

            <Perforation />

            <Box sx={{ px: 3, pt: 1.5, pb: 3 }}>{children}</Box>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
