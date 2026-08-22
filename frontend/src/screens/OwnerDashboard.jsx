import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { Users, ChevronRight } from 'lucide-react';
import DashboardShell from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import QueueBoard from '../components/QueueBoard';

export default function OwnerDashboard() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <DashboardShell roleKey="SHOP_OWNER">
        {/* Entry point to the shop list -> staff registration. */}
        <Box
          component={motion.button}
          type="button"
          onClick={() => navigate('/owner/shops')}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            width: '100%',
            mb: 2.5,
            p: 1.5,
            borderRadius: 2,
            cursor: 'pointer',
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 3,
            border: '1px solid rgba(200,155,60,0.16)',
            transition: 'box-shadow 200ms, border-color 200ms',
            '&:hover': { boxShadow: '0 16px 30px -14px rgba(0,0,0,0.65)', borderColor: 'rgba(200,155,60,0.4)' },
          }}
        >
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: '50%',
              bgcolor: 'rgba(200,155,60,0.14)',
              border: '1px solid rgba(200,155,60,0.35)',
              color: 'primary.dark',
            }}
          >
            <Users size={17} aria-hidden="true" />
          </Box>
          <Typography sx={{ flex: 1, textAlign: 'left', fontWeight: 700, fontSize: 14 }}>
            My Shops &amp; Staff
          </Typography>
          <ChevronRight size={18} aria-hidden="true" />
        </Box>

        {/* Owners get the full board incl. the no-show action. */}
        <QueueBoard canNoShow />
      </DashboardShell>
    </PageTransition>
  );
}
