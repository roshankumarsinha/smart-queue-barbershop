import { AnimatePresence, motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';
import { SHOP_TYPES, getShopType } from '../../config/shopTypes';

/*
 * Segmented shop-type picker. The selected chip is marked by a single brass pill
 * that slides between options via a shared layoutId (the same trick the login role
 * tabs use), and the helper blurb underneath cross-fades to match. Reads far better
 * than a dropdown for a small, fixed set — and every option stays one tap away.
 */
export default function ShopTypePicker({ value, onChange }) {
  const active = getShopType(value);

  return (
    <Box sx={{ mb: 1 }}>
      <Typography
        component="span"
        sx={{
          display: 'block',
          mb: 0.75,
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'text.secondary',
        }}
      >
        Type of venue
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {SHOP_TYPES.map((t) => {
          const selected = t.value === value;
          const Icon = t.icon;
          return (
            <Box
              key={t.value}
              component={motion.button}
              type="button"
              onClick={() => onChange(t.value)}
              aria-pressed={selected}
              whileTap={{ scale: 0.94 }}
              sx={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.25,
                py: 0.85,
                borderRadius: 999,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: selected ? 'transparent' : 'rgba(107,93,79,0.28)',
                bgcolor: selected ? 'transparent' : '#E7DDC9',
                color: selected ? '#241A14' : 'text.secondary',
                transition: 'color 200ms, border-color 200ms',
                minHeight: 36,
              }}
            >
              {selected && (
                <motion.span
                  layoutId="shopTypePill"
                  transition={{ type: 'spring', stiffness: 480, damping: 34 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 999,
                    background: 'linear-gradient(180deg,#E7C56B 0%,#C89B3C 55%,#A67C2E 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
                    zIndex: 0,
                  }}
                />
              )}
              <Box sx={{ position: 'relative', zIndex: 1, display: 'inline-flex' }}>
                <Icon size={15} aria-hidden="true" />
              </Box>
              <Typography sx={{ position: 'relative', zIndex: 1, fontSize: 13, fontWeight: 600 }}>
                {t.label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ minHeight: 18, mt: 0.6 }}>
        <AnimatePresence mode="wait">
          <Typography
            key={active.value}
            component={motion.span}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.18 }}
            sx={{ display: 'inline-block', fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}
          >
            {active.blurb}
          </Typography>
        </AnimatePresence>
      </Box>
    </Box>
  );
}
