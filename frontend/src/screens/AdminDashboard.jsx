import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { Box, Chip, CircularProgress, Typography } from '@mui/material';
import { Store } from 'lucide-react';
import DashboardShell, { PermissionList } from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import { getShops } from '../api/shops';
import { selectToken } from '../store/authSlice';
import { getRole } from '../config/roles';
import { staggerContainer, staggerItem } from '../lib/motion';

function ShopCard({ shop }) {
  return (
    <Box
      component={motion.div}
      variants={staggerItem}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        borderRadius: 2,
        p: 2,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 3,
        border: '1px solid rgba(200,155,60,0.16)',
        transition: 'box-shadow 200ms, border-color 200ms',
        '&:hover': {
          boxShadow: '0 16px 30px -14px rgba(0,0,0,0.65)',
          borderColor: 'rgba(200,155,60,0.4)',
        },
      }}
    >
      <Box sx={{ color: 'primary.dark' }}>
        <Store size={22} aria-hidden="true" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700 }} noWrap>
          {shop.name}
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
          {shop.whatsappNumber || 'No WhatsApp number'} · ~{shop.avgServiceTime}m/service
        </Typography>
      </Box>
      <Chip
        label={shop.active ? 'Active' : 'Inactive'}
        size="small"
        sx={{
          fontWeight: 600,
          bgcolor: shop.active ? 'rgba(63,122,87,0.15)' : 'rgba(107,93,79,0.15)',
          color: shop.active ? 'success.main' : 'text.secondary',
        }}
      />
    </Box>
  );
}

export default function AdminDashboard() {
  const token = useSelector(selectToken);
  const role = getRole('SUPER_ADMIN');

  const shopsQuery = useQuery({
    queryKey: ['shops'],
    queryFn: () => getShops(token),
    enabled: !!token,
  });

  const shops = shopsQuery.data ?? [];

  return (
    <PageTransition>
      <DashboardShell roleKey="SUPER_ADMIN">
        <Typography
          className="font-signage"
          sx={{ mb: 1.5, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'text.secondary' }}
        >
          Shops on the platform · {shops.length}
        </Typography>

        {shopsQuery.isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: 'primary.main' }} />
          </Box>
        ) : shopsQuery.isError ? (
          <Typography sx={{ color: 'error.main', py: 2 }}>
            Couldn’t load shops: {shopsQuery.error?.message ?? 'unknown error'}
          </Typography>
        ) : (
          <Box
            component={motion.div}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}
          >
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </Box>
        )}

        <Typography
          className="font-signage"
          sx={{ mb: 1.5, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'text.secondary' }}
        >
          Your permissions
        </Typography>
        <PermissionList permissions={role.permissions} />
      </DashboardShell>
    </PageTransition>
  );
}
