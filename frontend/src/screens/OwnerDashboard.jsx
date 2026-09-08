import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Users, BarChart3, ListOrdered, Store } from 'lucide-react';
import DashboardShell from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import NavTile from '../components/NavTile';
import { getMyShops } from '../api/shops';
import { selectToken } from '../store/authSlice';
import { getShopType } from '../config/shopTypes';
import ShopOpenToggle from '../components/ShopOpenToggle';
import { tileGrid } from '../lib/motion';

function SectionLabel({ children }) {
  return (
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
      {children}
    </Typography>
  );
}

// Compact identity banner for the single-shop owner: type icon, name, and a
// live status pill. Slides in above the action tiles.
function ShopBanner({ shop }) {
  const meta = getShopType(shop.type);
  const Icon = meta.icon;
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}
    >
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 52,
          height: 52,
          flexShrink: 0,
          borderRadius: 2,
          bgcolor: 'rgba(200,155,60,0.16)',
          border: '1px solid rgba(200,155,60,0.4)',
          color: 'primary.main',
        }}
      >
        <Icon size={24} aria-hidden="true" />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography className="font-display" sx={{ fontSize: 30, lineHeight: 1, color: '#F3ECDF' }} noWrap>
          {shop.name}
        </Typography>
        <Typography
          className="font-signage"
          sx={{ mt: 0.25, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'text.secondary' }}
        >
          {meta.label}
        </Typography>
      </Box>
      <ShopOpenToggle shop={shop} size="lg" />
    </Box>
  );
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const token = useSelector(selectToken);

  const shopsQuery = useQuery({
    queryKey: ['my-shops'],
    queryFn: () => getMyShops(token),
    enabled: !!token,
  });

  const shops = shopsQuery.data ?? [];
  const single = shops.length === 1 ? shops[0] : null;
  const openCount = shops.filter((s) => s.status === 'OPEN').length;

  function renderBody() {
    if (shopsQuery.isPending) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={26} sx={{ color: 'primary.main' }} />
        </Box>
      );
    }

    if (shopsQuery.isError) {
      return (
        <Typography sx={{ color: 'error.main', py: 2 }}>
          Couldn’t load your shops: {shopsQuery.error?.message ?? 'unknown error'}
        </Typography>
      );
    }

    // No shops yet — mirror the empty state used across the owner screens.
    if (shops.length === 0) {
      return (
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          sx={{ textAlign: 'center', py: 5, px: 2 }}
        >
          <Box
            component={motion.div}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 76,
              height: 76,
              mx: 'auto',
              mb: 2,
              borderRadius: '50%',
              bgcolor: 'rgba(200,155,60,0.1)',
              border: '1px dashed rgba(200,155,60,0.5)',
              color: 'primary.main',
            }}
          >
            <Store size={30} aria-hidden="true" />
          </Box>
          <Typography className="font-display" sx={{ fontSize: 26, color: '#F3ECDF', lineHeight: 1.1 }}>
            No shops yet
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: 14, color: 'text.secondary' }}>
            Ask your admin to register a shop under your account.
          </Typography>
        </Box>
      );
    }

    // One shop — drop the owner straight onto that shop's controls.
    if (single) {
      return (
        <>
          <ShopBanner shop={single} />
          <Box
            component={motion.div}
            variants={tileGrid}
            initial="hidden"
            animate="show"
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}
          >
            <NavTile
              icon={ListOrdered}
              label="Live Queue Management"
              hint="Serve, add walk-ins, skip & no-show"
              onClick={() => navigate(`/owner/shops/${single.id}/queue`)}
            />
            <NavTile
              icon={Users}
              label="Manage Staff"
              hint="Register barbers & reset PINs"
              onClick={() => navigate(`/owner/shops/${single.id}`)}
            />
            <NavTile
              icon={BarChart3}
              label="Statistics"
              hint="Live numbers for your shop"
              accent="oxblood"
              onClick={() => navigate(`/owner/shops/${single.id}/stats`)}
            />
          </Box>
        </>
      );
    }

    // Several shops — the hub: pick a shop, or see everything combined.
    return (
      <>
        <SectionLabel>
          {shops.length} shops · {openCount} open
        </SectionLabel>
        <Box
          component={motion.div}
          variants={tileGrid}
          initial="hidden"
          animate="show"
          sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}
        >
          <NavTile
            icon={Store}
            label="My Shops & Staff"
            hint="Open a shop's queue, staff & stats"
            onClick={() => navigate('/owner/shops')}
          />
          <NavTile
            icon={BarChart3}
            label="Statistics"
            hint="Combined numbers across all shops"
            accent="oxblood"
            onClick={() => navigate('/owner/stats')}
          />
        </Box>
      </>
    );
  }

  return (
    <PageTransition>
      <DashboardShell roleKey="SHOP_OWNER">{renderBody()}</DashboardShell>
    </PageTransition>
  );
}
