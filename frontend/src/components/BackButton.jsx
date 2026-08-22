import { motion } from 'framer-motion';
import { Box } from '@mui/material';
import { ArrowLeft } from 'lucide-react';

/*
 * Shared "go back" control. The old inline version was ivory-muted text on the
 * charcoal background that only turned brass on hover — invisible on touch,
 * where there is no hover. This is a proper brass-outlined pill: high contrast,
 * a 44px-tall touch target, and an arrow that nudges left on hover/press.
 */
export default function BackButton({ label = 'Back', onClick, sx }) {
  return (
    <Box
      component={motion.button}
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: -3 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      className="font-signage"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        minHeight: 40,
        mb: 2,
        pl: 1.25,
        pr: 1.75,
        py: 0.75,
        cursor: 'pointer',
        borderRadius: 999,
        bgcolor: 'rgba(200,155,60,0.12)',
        color: '#F3ECDF',
        border: '1.5px solid rgba(200,155,60,0.55)',
        fontWeight: 600,
        fontSize: 13,
        letterSpacing: '0.04em',
        boxShadow: '0 2px 10px -4px rgba(0,0,0,0.6)',
        transition: 'background-color 200ms, border-color 200ms, color 200ms',
        '& .back-arrow': { color: '#C89B3C', transition: 'transform 200ms' },
        '&:hover': {
          bgcolor: 'rgba(200,155,60,0.22)',
          borderColor: '#C89B3C',
          color: '#fff',
        },
        '&:hover .back-arrow': { transform: 'translateX(-2px)' },
        ...sx,
      }}
    >
      <ArrowLeft size={17} className="back-arrow" aria-hidden="true" />
      {label}
    </Box>
  );
}
