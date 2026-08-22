import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress, Typography } from '@mui/material';
import DashboardShell from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import BackButton from '../components/BackButton';
import OwnerStatsPanel from '../components/OwnerStatsPanel';
import { getMyShops } from '../api/shops';
import { selectToken } from '../store/authSlice';

// Owner's live statistics — its own route, reached from the dashboard's
// "Statistics" tile (mirrors how "My Shops & Staff" opens /owner/shops).
export default function OwnerStats() {
  const navigate = useNavigate();
  const token = useSelector(selectToken);

  const shopsQuery = useQuery({
    queryKey: ['myShops'],
    queryFn: () => getMyShops(token),
    enabled: !!token,
  });
  const shops = shopsQuery.data ?? [];

  return (
    <PageTransition>
      <DashboardShell roleKey="SHOP_OWNER">
        <BackButton label="Back to dashboard" onClick={() => navigate('/owner')} />

        <Typography
          className="font-signage"
          sx={{
            mb: 1.5,
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: 'text.secondary',
          }}
        >
          Your numbers today
        </Typography>

        {shopsQuery.isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={24} sx={{ color: 'primary.main' }} />
          </Box>
        ) : shopsQuery.isError ? (
          <Typography sx={{ color: 'error.main', py: 2 }}>
            Couldn’t load your shops: {shopsQuery.error?.message ?? 'unknown error'}
          </Typography>
        ) : (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <OwnerStatsPanel shops={shops} token={token} />
            <Typography sx={{ mt: 1, fontSize: 12, color: 'text.secondary' }}>
              Live figures across all your shops · updates automatically.
            </Typography>
          </Box>
        )}
      </DashboardShell>
    </PageTransition>
  );
}
