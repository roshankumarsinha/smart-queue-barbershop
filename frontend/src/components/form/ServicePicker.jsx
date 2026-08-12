import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { Box, Typography } from '@mui/material';
import { ChevronDown, Check, Sparkles } from 'lucide-react';
import { staggerContainer, staggerItem } from '../../lib/motion';

/*
 * Vintage service dropdown. Instead of a native <select> (which would clip inside the
 * ticket dialog and can't be themed), this expands an animated list INLINE below the
 * control — the panel grows the dialog and the options cascade in with a stagger, the
 * selected one gets a brass check. Only the services passed in (the shop's not-yet-added
 * catalog) are shown, so a service can never be picked twice.
 */
export default function ServicePicker({ value, options, onChange, error, shakeSignal = 0, disabled }) {
  const [open, setOpen] = useState(false);
  const controls = useAnimationControls();
  const selected = options.find((o) => o.code === value) ?? null;

  useEffect(() => {
    if (shakeSignal > 0) {
      controls.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.4, ease: 'easeInOut' } });
    }
  }, [shakeSignal, controls]);

  // Collapse if the chosen option disappears (e.g. the list refetched).
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <motion.div animate={controls} style={{ marginBottom: 4 }}>
      <Typography
        component="span"
        sx={{
          display: 'block',
          mb: 0.5,
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'text.secondary',
        }}
      >
        Service
      </Typography>

      {/* Control */}
      <Box
        component={motion.button}
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.995 }}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.75,
          py: 1.5,
          borderRadius: 2,
          cursor: disabled ? 'default' : 'pointer',
          textAlign: 'left',
          bgcolor: '#E7DDC9',
          color: selected ? '#241A14' : '#6B5D4F',
          border: 'none',
          boxShadow: error ? '0 0 0 2px #B23A32' : open ? '0 0 0 2px #C89B3C' : 'none',
          transition: 'box-shadow 150ms',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Sparkles size={16} className="text-ink-muted" aria-hidden="true" />
        <Typography sx={{ flex: 1, fontSize: 15, color: 'inherit' }} noWrap>
          {disabled ? 'All services added' : selected?.label ?? 'Choose a service'}
        </Typography>
        <Box component={motion.span} animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} sx={{ display: 'inline-flex', color: '#6B5D4F' }}>
          <ChevronDown size={18} aria-hidden="true" />
        </Box>
      </Box>

      {/* Inline expanding list */}
      <AnimatePresence initial={false}>
        {open && !disabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{ overflow: 'hidden' }}
          >
            <Box
              component={motion.ul}
              role="listbox"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              sx={{
                listStyle: 'none',
                m: 0,
                mt: 0.75,
                p: 0.75,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.25,
                borderRadius: 2,
                bgcolor: 'rgba(27,21,18,0.04)',
                border: '1px solid rgba(200,155,60,0.25)',
                maxHeight: 240,
                overflowY: 'auto',
              }}
            >
              {options.map((opt) => {
                const isSel = opt.code === value;
                return (
                  <Box
                    key={opt.code}
                    component={motion.li}
                    variants={staggerItem}
                    role="option"
                    aria-selected={isSel}
                    onClick={() => {
                      onChange(opt.code);
                      setOpen(false);
                    }}
                    whileHover={{ x: 3 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.25,
                      py: 1,
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      color: 'text.primary',
                      bgcolor: isSel ? 'rgba(200,155,60,0.16)' : 'transparent',
                      transition: 'background-color 150ms',
                      '&:hover': { bgcolor: isSel ? 'rgba(200,155,60,0.22)' : 'rgba(200,155,60,0.1)' },
                    }}
                  >
                    <Typography sx={{ flex: 1, fontSize: 14, fontWeight: isSel ? 700 : 500 }}>
                      {opt.label}
                    </Typography>
                    {isSel && <Check size={16} color="#A67C2E" aria-hidden="true" />}
                  </Box>
                );
              })}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <Typography sx={{ mt: 0.5, minHeight: 18, fontSize: 12, color: 'error.main' }}>
        {error ?? ' '}
      </Typography>
    </motion.div>
  );
}
