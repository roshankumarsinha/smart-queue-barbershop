import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress, Snackbar, Typography } from '@mui/material';
import { ArrowLeft, Store, Plus, MapPin, MessageCircle, Clock, CheckCircle2, Mail, ChevronRight, Sparkles } from 'lucide-react';
import DashboardShell from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import ShimmerButton from '../components/ShimmerButton';
import RegisterShopDialog from '../components/RegisterShopDialog';
import { getOwner, getOwnerShops } from '../api/owners';
import { selectToken } from '../store/authSlice';
import { getShopType } from '../config/shopTypes';
import { getStatusStyle } from '../config/shopStatus';
import { staggerContainer, staggerItem } from '../lib/motion';

function initialsOf(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function formatTime(t) {
  if (!t) return null;
  const [hStr, m] = t.split(':');
  const h = Number(hStr);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${suffix}`;
}

function ShopCard({ shop, justAdded, onOpen }) {
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
        border: '1px solid',
        borderColor: justAdded ? 'rgba(200,155,60,0.65)' : 'rgba(200,155,60,0.16)',
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
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.4,
            borderRadius: 999,
            flexShrink: 0,
            bgcolor: st.bg,
            color: st.color,
          }}
        >
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: st.dot }} />
          <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{st.label}</Typography>
        </Box>
      </Box>

      {/* Meta chips */}
      {(hours || shop.whatsappNumber || shop.locationUrl) && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.25 }}>
          {hours && <MetaChip icon={Clock} label={hours} />}
          {shop.whatsappNumber && <MetaChip icon={MessageCircle} label={shop.whatsappNumber} />}
          {shop.locationUrl && (
            <MetaChip icon={MapPin} label="Map" href={shop.locationUrl} />
          )}
        </Box>
      )}

      <IdLine label="Shop ID" value={shop.id} />

      {/* Affordance: the whole card opens the shop's services */}
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
        <Sparkles size={14} aria-hidden="true" />
        <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 700 }}>Manage services</Typography>
        <ChevronRight
          size={18}
          aria-hidden="true"
          className="manage-chev"
          style={{ transition: 'transform 200ms' }}
        />
      </Box>
    </Box>
  );
}

// A small, copy-friendly monospace id line for admins to cross-reference records.
function IdLine({ label, value }) {
  return (
    <Typography
      component="div"
      onClick={(e) => e.stopPropagation()}
      sx={{
        mt: 1.25,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        color: 'text.secondary',
        wordBreak: 'break-all',
        userSelect: 'all',
        cursor: 'text',
      }}
    >
      <Box component="span" sx={{ opacity: 0.7 }}>{label} · </Box>
      {value}
    </Typography>
  );
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
    <Box
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      sx={{ ...sx, cursor: 'pointer' }}
    >
      {inner}
    </Box>
  ) : (
    <Box component="span" sx={sx}>{inner}</Box>
  );
}

export default function OwnerShops() {
  const { ownerId } = useParams();
  const token = useSelector(selectToken);
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [justAddedId, setJustAddedId] = useState(null);
  const [toast, setToast] = useState('');

  const ownerQuery = useQuery({
    queryKey: ['owner', ownerId],
    queryFn: () => getOwner(ownerId, token),
    enabled: !!token && !!ownerId,
  });
  const shopsQuery = useQuery({
    queryKey: ['owner-shops', ownerId],
    queryFn: () => getOwnerShops(ownerId, token),
    enabled: !!token && !!ownerId,
  });

  const owner = ownerQuery.data;
  const shops = shopsQuery.data ?? [];
  const hasShops = shops.length > 0;

  function handleCreated(shop) {
    setJustAddedId(shop.id);
    setToast(`${shop.name} registered`);
    setTimeout(() => setJustAddedId(null), 2600);
  }

  return (
    <PageTransition>
      <DashboardShell roleKey="ADMIN">
        {/* Back */}
        <Box
          component={motion.button}
          type="button"
          onClick={() => navigate('/admin')}
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
          <ArrowLeft size={16} /> All owners
        </Box>

        {/* Owner banner */}
        {owner && (
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
                borderRadius: '50%',
                bgcolor: 'rgba(200,155,60,0.16)',
                border: '1px solid rgba(200,155,60,0.4)',
                color: 'primary.main',
              }}
            >
              <Typography className="font-display" sx={{ fontSize: 22, lineHeight: 1 }}>
                {initialsOf(owner.name)}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography className="font-display" sx={{ fontSize: 30, lineHeight: 1, color: '#F3ECDF' }} noWrap>
                {owner.name}
              </Typography>
              <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 13, color: 'text.secondary' }} noWrap>
                <Mail size={12} /> {owner.email}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Section header + add */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
          <Typography
            className="font-signage"
            sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'text.secondary' }}
          >
            Shops · {shops.length}
          </Typography>
          {hasShops && (
            <ShimmerButton onClick={() => setDialogOpen(true)} className="!px-4 !py-2.5 text-[13px]">
              <Plus size={16} /> Add Shop
            </ShimmerButton>
          )}
        </Box>

        {shopsQuery.isPending || ownerQuery.isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={24} sx={{ color: 'primary.main' }} />
          </Box>
        ) : ownerQuery.isError ? (
          <Typography sx={{ color: 'error.main', py: 2 }}>
            Couldn’t load this owner: {ownerQuery.error?.message ?? 'unknown error'}
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
            <Typography sx={{ mt: 0.5, mb: 2.5, fontSize: 14, color: 'text.secondary' }}>
              Register the first shop under {owner?.name ?? 'this owner'}.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ShimmerButton onClick={() => setDialogOpen(true)} className="text-[15px]">
                <Plus size={18} /> Register a Shop
              </ShimmerButton>
            </Box>
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
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  justAdded={shop.id === justAddedId}
                  onOpen={() => navigate(`/admin/shops/${shop.id}`)}
                />
              ))}
            </AnimatePresence>
          </Box>
        )}

        <RegisterShopDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          ownerId={ownerId}
          ownerName={owner?.name}
          onCreated={handleCreated}
        />

        <Snackbar
          open={!!toast}
          autoHideDuration={3200}
          onClose={() => setToast('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          message={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle2 size={18} color="#7CCFa0" />
              <span>{toast}</span>
            </Box>
          }
          sx={{
            '& .MuiSnackbarContent-root': {
              bgcolor: '#241A14',
              color: '#F3ECDF',
              border: '1px solid rgba(200,155,60,0.4)',
              fontWeight: 600,
            },
          }}
        />
      </DashboardShell>
    </PageTransition>
  );
}
