import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Store, MapPin, MessageCircle, Clock, Users, ListOrdered, BarChart3 } from 'lucide-react';
import BackButton from '../components/BackButton';
import DashboardShell from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import { getMyShops } from '../api/shops';
import { selectToken } from '../store/authSlice';
import { getShopType } from '../config/shopTypes';
import { getStatusStyle } from '../config/shopStatus';
import { tileGrid, tileItem } from '../lib/motion';

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

// One of the three per-shop actions. A brass-tinted pill that lifts + brightens
// on hover, springs on tap. `accent` recolors it ('brass' | 'oxblood').
function ShopAction({ icon: Icon, label, onClick, accent = 'brass' }) {
  const brass = accent === 'brass';
  return (
    <Box
      component={motion.button}
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      className="font-signage"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        py: 1.1,
        px: 0.5,
        cursor: 'pointer',
        borderRadius: 2,
        border: '1px solid',
        borderColor: brass ? 'rgba(200,155,60,0.35)' : 'rgba(123,45,45,0.35)',
        bgcolor: brass ? 'rgba(200,155,60,0.1)' : 'rgba(123,45,45,0.1)',
        color: brass ? 'primary.dark' : 'secondary.main',
        fontWeight: 700,
        fontSize: 11.5,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        transition: 'background-color 180ms, border-color 180ms',
        '&:hover': {
          bgcolor: brass ? 'rgba(200,155,60,0.2)' : 'rgba(123,45,45,0.18)',
          borderColor: brass ? 'rgba(200,155,60,0.6)' : 'rgba(123,45,45,0.55)',
        },
      }}
    >
      <Icon size={18} aria-hidden="true" />
      {label}
    </Box>
  );
}

function ShopCard({ shop, navigate }) {
  const meta = getShopType(shop.type);
  const Icon = meta.icon;
  const st = getStatusStyle(shop.status);
  const hours = shop.openingTime && shop.closingTime
    ? `${formatTime(shop.openingTime)} – ${formatTime(shop.closingTime)}`
    : null;

  return (
    <Box
      component={motion.div}
      variants={tileItem}
      layout
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      sx={{
        borderRadius: 2,
        p: 1.75,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 3,
        border: '1px solid rgba(200,155,60,0.16)',
        transition: 'box-shadow 200ms, border-color 200ms',
        '&:hover': { boxShadow: '0 16px 30px -14px rgba(0,0,0,0.65)', borderColor: 'rgba(200,155,60,0.4)' },
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

      {/* Per-shop actions — each opens that feature scoped to this shop. */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 0.75,
          mt: 1.5,
          pt: 1.5,
          borderTop: '1px dashed rgba(107,93,79,0.25)',
        }}
      >
        <ShopAction icon={ListOrdered} label="Queue" onClick={() => navigate(`/owner/shops/${shop.id}/queue`)} />
        <ShopAction icon={Users} label="Staff" onClick={() => navigate(`/owner/shops/${shop.id}`)} />
        <ShopAction icon={BarChart3} label="Stats" accent="oxblood" onClick={() => navigate(`/owner/shops/${shop.id}/stats`)} />
      </Box>
    </Box>
  );
}

// Self-service shop list for a SHOP_OWNER. Each card carries the three per-shop
// actions (live queue, staff, stats); the admin's owner-drill-down lives in
// OwnerShops.jsx.
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
        <BackButton label="Back to dashboard" onClick={() => navigate('/owner')} />

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
            variants={tileGrid}
            initial="hidden"
            animate="show"
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 3 }}
          >
            <AnimatePresence initial={false}>
              {shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} navigate={navigate} />
              ))}
            </AnimatePresence>
          </Box>
        )}
      </DashboardShell>
    </PageTransition>
  );
}
