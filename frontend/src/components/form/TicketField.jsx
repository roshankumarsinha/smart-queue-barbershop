import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { TextField, InputAdornment, IconButton, Typography } from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';

/*
 * A single vintage "ticket" form field: uppercase signage label, ivory-dim filled
 * input with a brass focus ring, an optional leading icon, a reveal toggle for
 * secret fields, and a horizontal shake on invalid submit. Extracted from the
 * login screen so every admin form (owner + shop) shares one look and feel.
 *
 * Props: name, label, value, error, onChange(name, value), icon (lucide comp),
 * type ('text'|'email'|'tel'|'password'|'number'|'time'), placeholder,
 * shakeSignal (increment to trigger a shake), plus inputMode/maxLength/autoComplete.
 */
export default function TicketField({
  name,
  label,
  value,
  error,
  onChange,
  icon: Icon,
  type = 'text',
  placeholder,
  shakeSignal = 0,
  inputMode,
  maxLength,
  autoComplete,
  endHint,
}) {
  const controls = useAnimationControls();
  const isSecret = type === 'password';
  const [revealed, setRevealed] = useState(false);
  const RevealIcon = revealed ? EyeOff : Eye;
  const inputType = isSecret ? (revealed ? 'text' : 'password') : type;

  useEffect(() => {
    if (shakeSignal > 0) {
      controls.start({
        x: [0, -6, 6, -4, 4, 0],
        transition: { duration: 0.4, ease: 'easeInOut' },
      });
    }
  }, [shakeSignal, controls]);

  return (
    <motion.div animate={controls} style={{ marginBottom: 4 }}>
      <Typography
        component="label"
        htmlFor={name}
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
        {label}
      </Typography>
      <TextField
        id={name}
        name={name}
        type={inputType}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        error={!!error}
        helperText={error ?? ' '}
        fullWidth
        hiddenLabel
        variant="filled"
        autoComplete={autoComplete}
        slotProps={{
          input: {
            disableUnderline: true,
            startAdornment: Icon ? (
              <InputAdornment position="start">
                <Icon size={16} className="text-ink-muted" aria-hidden="true" />
              </InputAdornment>
            ) : undefined,
            endAdornment: isSecret ? (
              <InputAdornment position="end">
                <IconButton
                  type="button"
                  onClick={() => setRevealed((v) => !v)}
                  aria-label={revealed ? 'Hide password' : 'Show password'}
                  aria-pressed={revealed}
                  edge="end"
                  disableRipple
                  component={motion.button}
                  whileTap={{ scale: 0.85 }}
                  sx={{
                    width: 44,
                    height: 44,
                    color: '#6B5D4F',
                    transition: 'color 150ms',
                    '&:hover': { color: '#A67C2E', bgcolor: 'transparent' },
                  }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={revealed ? 'off' : 'on'}
                      initial={{ opacity: 0, rotateX: -90, scale: 0.6 }}
                      animate={{ opacity: 1, rotateX: 0, scale: 1 }}
                      exit={{ opacity: 0, rotateX: 90, scale: 0.6 }}
                      transition={{ duration: 0.18, ease: 'easeInOut' }}
                      style={{ display: 'inline-flex' }}
                    >
                      <RevealIcon size={18} aria-hidden="true" />
                    </motion.span>
                  </AnimatePresence>
                </IconButton>
              </InputAdornment>
            ) : endHint ? (
              <InputAdornment position="end">
                <Typography sx={{ fontSize: 12, color: 'text.secondary', pr: 0.5 }}>
                  {endHint}
                </Typography>
              </InputAdornment>
            ) : undefined,
          },
          htmlInput: {
            inputMode,
            maxLength,
            'aria-invalid': !!error,
          },
        }}
        sx={{
          '& .MuiFilledInput-root': {
            bgcolor: '#E7DDC9',
            borderRadius: 2,
            transition: 'box-shadow 150ms',
            '&:hover': { bgcolor: '#E7DDC9' },
            '&.Mui-focused': {
              bgcolor: '#E7DDC9',
              boxShadow: '0 0 0 2px #C89B3C',
            },
            '&.Mui-error': { boxShadow: '0 0 0 2px #B23A32' },
          },
          '& .MuiFilledInput-input': { color: '#241A14' },
          // The native time picker indicator, tinted to the ink palette.
          '& input[type=time]::-webkit-calendar-picker-indicator': {
            filter: 'invert(35%) sepia(10%) saturate(600%) hue-rotate(350deg)',
            cursor: 'pointer',
          },
        }}
      />
    </motion.div>
  );
}
