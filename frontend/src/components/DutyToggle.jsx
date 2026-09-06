import { motion, AnimatePresence } from 'framer-motion';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Armchair, Power } from 'lucide-react';

// An animated on/off-duty switch. `size="lg"` is the barber's own prominent
// control (icon + label + hint + switch); `size="sm"` is a compact switch the
// owner uses per barber. The knob slides on a spring and the track cross-fades
// green↔muted. Disabled while `pending`, showing a spinner in the knob.
//
// role="switch" + aria-checked keep it accessible; it's keyboard-activatable as
// a <button>.
export default function DutyToggle({ checked, onChange, pending = false, size = 'lg', disabled = false }) {
  const sm = size === 'sm';
  const trackW = sm ? 46 : 58;
  const trackH = sm ? 26 : 32;
  const knob = trackH - 8;
  const travel = trackW - knob - 8;

  const track = (
    <Box
      component={motion.span}
      animate={{
        backgroundColor: checked ? 'rgba(63,122,87,0.9)' : 'rgba(107,93,79,0.45)',
        borderColor: checked ? 'rgba(124,207,160,0.7)' : 'rgba(243,236,223,0.25)',
      }}
      transition={{ duration: 0.25 }}
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: trackW,
        height: trackH,
        flexShrink: 0,
        borderRadius: 999,
        border: '1px solid',
        px: '4px',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
      }}
    >
      <Box
        component={motion.span}
        animate={{ x: checked ? travel : 0 }}
        transition={{ type: 'spring', stiffness: 620, damping: 34 }}
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: knob,
          height: knob,
          borderRadius: '50%',
          bgcolor: '#F3ECDF',
          boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
          color: checked ? '#3F7A57' : '#6B5D4F',
        }}
      >
        {pending ? (
          <CircularProgress size={knob - 8} thickness={6} sx={{ color: 'inherit' }} />
        ) : (
          <Power size={sm ? 11 : 13} strokeWidth={3} aria-hidden="true" />
        )}
      </Box>
    </Box>
  );

  if (sm) {
    return (
      <Box
        component={motion.button}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={checked ? 'On duty — tap to go off duty' : 'Off duty — tap to go on duty'}
        onClick={() => !pending && !disabled && onChange(!checked)}
        whileTap={{ scale: 0.92 }}
        disabled={pending || disabled}
        sx={{ p: 0, border: 'none', bgcolor: 'transparent', cursor: pending || disabled ? 'default' : 'pointer', lineHeight: 0 }}
      >
        {track}
      </Box>
    );
  }

  return (
    <Box
      component={motion.button}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? 'On duty — tap to go off duty' : 'Off duty — tap to go on duty'}
      onClick={() => !pending && !disabled && onChange(!checked)}
      whileTap={{ scale: 0.99 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      disabled={pending || disabled}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        width: '100%',
        textAlign: 'left',
        cursor: pending || disabled ? 'default' : 'pointer',
        p: 1.5,
        mb: 2.5,
        borderRadius: 3,
        bgcolor: 'background.paper',
        boxShadow: 4,
        border: '1px solid',
        borderColor: checked ? 'rgba(63,122,87,0.5)' : 'rgba(200,155,60,0.2)',
        transition: 'border-color 250ms',
      }}
    >
      <Box
        component={motion.span}
        animate={{
          backgroundColor: checked ? 'rgba(63,122,87,0.16)' : 'rgba(107,93,79,0.14)',
          color: checked ? '#3F7A57' : '#6B5D4F',
          rotate: checked ? 0 : -8,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: '50%',
          border: '1px solid',
          borderColor: checked ? 'rgba(124,207,160,0.5)' : 'rgba(200,155,60,0.3)',
        }}
      >
        <Armchair size={22} aria-hidden="true" />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box className="font-display" sx={{ fontSize: 22, lineHeight: 1, color: '#F3ECDF' }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={checked ? 'on' : 'off'}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'inline-block' }}
            >
              {checked ? 'On duty' : 'Off duty'}
            </motion.span>
          </AnimatePresence>
        </Box>
        <Typography sx={{ mt: 0.25, fontSize: 12.5, color: 'text.secondary' }}>
          {checked ? 'Your chair is open — customers can be seated' : 'Tap to open your chair and take customers'}
        </Typography>
      </Box>

      {track}
    </Box>
  );
}
