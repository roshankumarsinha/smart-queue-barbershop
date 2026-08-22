import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { Users, ChevronRight, BarChart3 } from 'lucide-react';
import DashboardShell from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import QueueBoard from '../components/QueueBoard';
import { staggerContainer, staggerItem } from '../lib/motion';

// A full-width dashboard nav row: brass icon badge on the left, label + hint in
// the middle, trailing chevron. Lifts + the badge tilts on hover; the chevron
// nudges right; springs down on tap.
function NavTile({ icon: Icon, label, hint, onClick }) {
  return (
    <Box
      component={motion.button}
      type="button"
      onClick={onClick}
      variants={staggerItem}
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
        '&:hover': {
          boxShadow: '0 18px 34px -16px rgba(0,0,0,0.7)',
          borderColor: 'rgba(200,155,60,0.5)',
        },
        '&:hover .nav-badge': { transform: 'scale(1.08) rotate(-6deg)' },
        '&:hover .nav-chev': { transform: 'translateX(3px)', color: '#A67C2E' },
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
          bgcolor: 'rgba(200,155,60,0.16)',
          border: '1px solid rgba(200,155,60,0.4)',
          color: 'primary.dark',
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

export default function OwnerDashboard() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <DashboardShell roleKey="SHOP_OWNER">
        {/* Nav tiles */}
        <Box
          component={motion.div}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25,
            mb: 2.5,
          }}
        >
          <NavTile
            icon={Users}
            label="My Shops & Staff"
            hint="Manage shops, services & barbers"
            onClick={() => navigate('/owner/shops')}
          />
          <NavTile
            icon={BarChart3}
            label="Statistics"
            hint="Live queue at a glance"
            onClick={() => navigate('/owner/stats')}
          />
        </Box>

        {/* Owners get the full board incl. the no-show action. */}
        <QueueBoard canNoShow />
      </DashboardShell>
    </PageTransition>
  );
}
