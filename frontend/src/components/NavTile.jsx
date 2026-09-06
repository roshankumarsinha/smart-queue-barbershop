import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';
import { ChevronRight } from 'lucide-react';
import { tileItem } from '../lib/motion';

// A full-width dashboard nav row: round icon badge on the left, label + hint in
// the middle, trailing chevron. On hover the whole tile lifts, the badge springs
// up with a tilt, a brass "gleam" sweeps across, and the chevron nudges right.
// Springs down on tap. `accent` recolors the badge/gleam ('brass' | 'oxblood').
//
// Shared by the owner dashboard (single- and multi-shop) so the tiles look and
// move identically wherever they appear.
const ACCENTS = {
  brass: {
    badgeBg: 'rgba(200,155,60,0.16)',
    badgeBorder: 'rgba(200,155,60,0.4)',
    badgeColor: 'primary.dark',
    hoverBorder: 'rgba(200,155,60,0.5)',
    gleam: 'rgba(200,155,60,0.22)',
    chevHover: '#A67C2E',
  },
  oxblood: {
    badgeBg: 'rgba(123,45,45,0.14)',
    badgeBorder: 'rgba(123,45,45,0.4)',
    badgeColor: 'secondary.main',
    hoverBorder: 'rgba(123,45,45,0.5)',
    gleam: 'rgba(123,45,45,0.2)',
    chevHover: '#7B2D2D',
  },
};

export default function NavTile({ icon: Icon, label, hint, onClick, accent = 'brass' }) {
  const a = ACCENTS[accent] ?? ACCENTS.brass;

  return (
    <Box
      component={motion.button}
      type="button"
      onClick={onClick}
      variants={tileItem}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 1.5,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        p: 1.75,
        borderRadius: 3,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 4,
        border: '1px solid rgba(200,155,60,0.18)',
        transition: 'box-shadow 200ms, border-color 200ms',
        // Brass gleam: an angled highlight parked off the left edge that sweeps
        // across on hover. transform-only, so it stays on the compositor.
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '55%',
          transform: 'translateX(-160%) skewX(-18deg)',
          background: `linear-gradient(90deg, transparent, ${a.gleam}, transparent)`,
          transition: 'transform 650ms cubic-bezier(0.22,1,0.36,1)',
          pointerEvents: 'none',
        },
        '&:hover': {
          boxShadow: '0 18px 34px -16px rgba(0,0,0,0.7)',
          borderColor: a.hoverBorder,
        },
        '&:hover::before': { transform: 'translateX(320%) skewX(-18deg)' },
        '&:hover .nav-badge': { transform: 'scale(1.08) rotate(-6deg)' },
        '&:hover .nav-chev': { transform: 'translateX(3px)', color: a.chevHover },
      }}
    >
      <Box
        className="nav-badge"
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 46,
          height: 46,
          flexShrink: 0,
          borderRadius: '50%',
          bgcolor: a.badgeBg,
          border: `1px solid ${a.badgeBorder}`,
          color: a.badgeColor,
          transition: 'transform 250ms cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <Icon size={22} aria-hidden="true" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16, lineHeight: 1.15 }}>{label}</Typography>
        <Typography sx={{ mt: 0.25, fontSize: 12.5, color: 'text.secondary' }}>{hint}</Typography>
      </Box>
      <ChevronRight
        size={22}
        aria-hidden="true"
        className="nav-chev"
        style={{ color: '#6B5D4F', flexShrink: 0, transition: 'transform 200ms, color 200ms' }}
      />
    </Box>
  );
}
