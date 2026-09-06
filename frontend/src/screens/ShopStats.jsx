import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography } from '@mui/material';
import { Users, Clock, Scissors, UserCog } from 'lucide-react';
import BackButton from '../components/BackButton';
import DashboardShell from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import AnimatedNumber from '../components/AnimatedNumber';
import { getShop } from '../api/shops';
import { getQueueStatus } from '../api/queue';
import { getShopStaff } from '../api/staff';
import { selectToken } from '../store/authSlice';
import { getShopType } from '../config/shopTypes';
import { getStatusStyle } from '../config/shopStatus';
import { tileGrid, tileItem } from '../lib/motion';

// One animated stat tile. `value` is either a number (rolls with AnimatedNumber)
// or a string (pops in). `live` shows a pulsing dot for real-time figures.
function StatCard({ icon: Icon, value, unit, label, live, string }) {
  return (
    <Box
      component={motion.div}
      variants={tileItem}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      sx={{
        position: 'relative',
        borderRadius: 2,
        p: 1.75,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 3,
        border: '1px solid rgba(200,155,60,0.18)',
        overflow: 'hidden',
        transition: 'box-shadow 200ms, border-color 200ms',
        '&:hover': {
          boxShadow: '0 16px 30px -14px rgba(0,0,0,0.65)',
          borderColor: 'rgba(200,155,60,0.4)',
        },
      }}
    >
      {live && (
        <Box
          component={motion.span}
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          sx={{ position: 'absolute', top: 10, right: 10, width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main' }}
        />
      )}
      <Box sx={{ mb: 0.5, color: 'primary.dark' }}>
        <Icon size={18} aria-hidden="true" />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Box className="font-display" sx={{ fontSize: 32, lineHeight: 1, color: 'primary.dark' }}>
          {value === null || value === undefined ? (
            <Box component="span" sx={{ color: 'text.secondary' }}>—</Box>
          ) : string ? (
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={String(value)}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.22 }}
                style={{ display: 'inline-block' }}
              >
                {value}
              </motion.span>
            </AnimatePresence>
          ) : (
            <AnimatedNumber value={value} />
          )}
        </Box>
        {value !== null && value !== undefined && unit && !string && (
          <Box component="span" sx={{ fontFamily: (t) => t.typography.fontFamily, fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
            {unit}
          </Box>
        )}
      </Box>
      <Typography sx={{ mt: 0.25, fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
    </Box>
  );
}

// Live statistics for a single shop, reached from the single-shop dashboard or a
// "My Shops" card. Queue numbers poll every 5s; staff count comes from the roster.
export default function ShopStats() {
  const { shopId } = useParams();
  const token = useSelector(selectToken);
  const navigate = useNavigate();

  const shopQuery = useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => getShop(shopId, token),
    enabled: !!token && !!shopId,
  });
  const boardQuery = useQuery({
    queryKey: ['queue', shopId],
    queryFn: () => getQueueStatus(shopId, token),
    enabled: !!token && !!shopId,
    refetchInterval: 5000,
  });
  const staffQuery = useQuery({
    queryKey: ['shop-staff', shopId],
    queryFn: () => getShopStaff(shopId, token),
    enabled: !!token && !!shopId,
  });

  const shop = shopQuery.data;
  const meta = shop ? getShopType(shop.type) : null;
  const TypeIcon = meta?.icon ?? Scissors;
  const st = shop ? getStatusStyle(shop.status) : null;

  const board = boardQuery.data;
  const loaded = boardQuery.isSuccess;
  const servingList = Array.isArray(board?.serving) ? board.serving : board?.serving ? [board.serving] : [];
  const waiting = loaded ? board?.totalWaiting ?? 0 : null;
  const eta = loaded ? board?.estimatedWaitMinutes ?? 0 : null;
  const serving = loaded ? servingList.length : null;
  const staffCount = staffQuery.isSuccess ? (staffQuery.data?.length ?? 0) : null;

  return (
    <PageTransition>
      <DashboardShell roleKey="SHOP_OWNER">
        <BackButton label="Back" onClick={() => navigate(-1)} />

        {shop && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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
              <TypeIcon size={24} aria-hidden="true" />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography className="font-display" sx={{ fontSize: 30, lineHeight: 1, color: '#F3ECDF' }} noWrap>
                {shop.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                <Typography className="font-signage" sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'text.secondary' }}>
                  Statistics
                </Typography>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 0.85, py: 0.25, borderRadius: 999, bgcolor: st.bg, color: st.color }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: st.dot }} />
                  <Typography sx={{ fontSize: 10, fontWeight: 700 }}>{st.label}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {shopQuery.isError ? (
          <Typography sx={{ color: 'error.main', py: 2 }}>
            Couldn’t load this shop: {shopQuery.error?.message ?? 'unknown error'}
          </Typography>
        ) : (
          <>
            <Box
              component={motion.div}
              variants={tileGrid}
              initial="hidden"
              animate="show"
              sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.25 }}
            >
              <StatCard icon={Users} value={waiting} label="Customers waiting" live />
              <StatCard icon={Clock} value={eta} unit="min" label="Est. wait" live />
              <StatCard icon={Scissors} value={serving} label="In the chair" live />
              <StatCard icon={UserCog} value={staffCount} label="Barbers on roster" />
            </Box>
            <Typography sx={{ mt: 1.25, fontSize: 12, color: 'text.secondary' }}>
              Live figures for {shop?.name ?? 'this shop'} · updates automatically.
            </Typography>
          </>
        )}
      </DashboardShell>
    </PageTransition>
  );
}
