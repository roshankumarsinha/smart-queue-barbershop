import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ArrowLeft, Store, MapPin, MessageCircle, Clock, ChevronRight, Users } from 'lucide-react';
import DashboardShell from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import { getMyShops } from '../api/shops';
import { selectToken } from '../store/authSlice';
import { getShopType } from '../config/shopTypes';
import { getStatusStyle } from '../config/shopStatus';
import { staggerContainer, staggerItem } from '../lib/motion';

function formatTime(t) {
  if (!t) return null;
  const [hStr, m] = t.split(':');
  const h = Number(hStr);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${suffix}`;
}

function MetaChip({ icon: Icon, label, href }) {
  const inner = (
    <>
      <Icon size={12} aria-hidden="true" />
      <span>{label}</span>
    </>
  );
  const sx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.5,
    px: 1,
    py: 0.4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    bgcolor: 'rgba(27,21,18,0.06)',
    color: 'text.secondary',
    textDecoration: 'none',
    ...(href && { '&:hover': { color: 'primary.dark', bgcolor: 'rgba(200,155,60,0.16)' } }),
  };
  return href ? (
    <Box component="a" href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} sx={{ ...sx, cursor: 'pointer' }}>
      {inner}
    </Box>
  ) : (
    <Box component="span" sx={sx}>{inner}</Box>
  );
}

function ShopCard({ shop, onOpen }) {
  const meta = getShopType(shop.type);
  const Icon = meta.icon;
  const st = getStatusStyle(shop.status);
  const hours = shop.openingTime && shop.closingTime
    ? `${formatTime(shop.openingTime)} – ${formatTime(shop.closingTime)}`
    : null;

  return (
    <Box
      component={motion.div}
      variants={staggerItem}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      sx={{
        borderRadius: 2,
        p: 1.75,
        cursor: 'pointer',
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 3,
        border: '1px solid rgba(200,155,60,0.16)',
        transition: 'box-shadow 200ms, border-color 200ms',
        '&:hover': { boxShadow: '0 16px 30px -14px rgba(0,0,0,0.65)', borderColor: 'rgba(200,155,60,0.4)' },
        '&:hover .manage-chev': { transform: 'translateX(3px)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 42,
            height: 42,
            flexShrink: 0,
            borderRadius: 2,
            bgcolor: 'rgba(200,155,60,0.14)',
            border: '1px solid rgba(200,155,60,0.35)',
            color: 'primary.dark',
          }}
        >
          <Icon size={20} aria-hidden="true" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }} noWrap>{shop.name}</Typography>
          <Typography className="font-signage" sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'text.secondary' }}>
            {meta.label}
          </Typography>
        </Box>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.4, borderRadius: 999, flexShrink: 0, bgcolor: st.bg, color: st.color }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: st.dot }} />
          <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{st.label}</Typography>
        </Box>
      </Box>

      {(hours || shop.whatsappNumber || shop.locationUrl) && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.25 }}>
          {hours && <MetaChip icon={Clock} label={hours} />}
          {shop.whatsappNumber && <MetaChip icon={MessageCircle} label={shop.whatsappNumber} />}
          {shop.locationUrl && <MetaChip icon={MapPin} label="Map" href={shop.locationUrl} />}
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          mt: 1.25,
          pt: 1.25,
          borderTop: '1px dashed rgba(107,93,79,0.25)',
          color: 'primary.dark',
        }}
      >
        <Users size={14} aria-hidden="true" />
        <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 700 }}>Manage staff</Typography>
        <ChevronRight size={18} aria-hidden="true" className="manage-chev" style={{ transition: 'transform 200ms' }} />
      </Box>
    </Box>
  );
}

// Self-service shop list for a SHOP_OWNER — the counterpart to the admin's
// owner-drill-down (OwnerShops.jsx), but scoped to the signed-in owner and
// without a "register shop" action (only ADMIN registers shops for now).
export default function MyShops() {
  const token = useSelector(selectToken);
  const navigate = useNavigate();

  const shopsQuery = useQuery({
    queryKey: ['my-shops'],
    queryFn: () => getMyShops(token),
    enabled: !!token,
  });

  const shops = shopsQuery.data ?? [];
  const hasShops = shops.length > 0;

  return (
    <PageTransition>
      <DashboardShell roleKey="SHOP_OWNER">
        <Box
          component={motion.button}
          type="button"
          onClick={() => navigate('/owner')}
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.97 }}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            mb: 2,
            cursor: 'pointer',
            color: 'text.secondary',
            bgcolor: 'transparent',
            border: 'none',
            fontWeight: 600,
            fontSize: 13,
            '&:hover': { color: 'primary.main' },
          }}
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Box>

        <Typography
          className="font-signage"
          sx={{ mb: 1.5, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'text.secondary' }}
        >
          My Shops · {shops.length}
        </Typography>

        {shopsQuery.isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={24} sx={{ color: 'primary.main' }} />
          </Box>
        ) : shopsQuery.isError ? (
          <Typography sx={{ color: 'error.main', py: 2 }}>
            Couldn't load your shops: {shopsQuery.error?.message ?? 'unknown error'}
          </Typography>
        ) : !hasShops ? (
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
        ) : (
          <Box
            component={motion.div}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 3 }}
          >
            <AnimatePresence initial={false}>
              {shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} onOpen={() => navigate(`/owner/shops/${shop.id}`)} />
              ))}
            </AnimatePresence>
          </Box>
        )}
      </DashboardShell>
    </PageTransition>
  );
}
