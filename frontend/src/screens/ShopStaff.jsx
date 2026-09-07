import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, CircularProgress, IconButton, Snackbar, Typography } from '@mui/material';
import { ArrowRight, Sparkles, UserPlus, Trash2, KeyRound, Phone, Scissors, CheckCircle2, Armchair } from 'lucide-react';
import BackButton from '../components/BackButton';
import DashboardShell from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import ShimmerButton from '../components/ShimmerButton';
import AddStaffDialog from '../components/AddStaffDialog';
import ResetStaffPinDialog from '../components/ResetStaffPinDialog';
import DutyToggle from '../components/DutyToggle';
import { getShop } from '../api/shops';
import { getShopStaff, removeShopStaff, setStaffDuty } from '../api/staff';
import { selectRole, selectToken } from '../store/authSlice';
import { getShopType } from '../config/shopTypes';
import { getStatusStyle } from '../config/shopStatus';
import { staggerContainer, staggerItem } from '../lib/motion';

function initialsOf(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

// isAdmin gates the delete button — the backend rejects a shop owner's own delete
// attempt outright, so the UI hides the affordance rather than let them hit a 403.
// Resetting a PIN, unlike deleting, is open to both ADMIN and the shop's own owner
// (whoever can reach this screen at all), so onResetPin has no such gate.
function StaffCard({ staff, shopId, justAdded, isAdmin, onResetPin }) {
  const token = useSelector(selectToken);
  const queryClient = useQueryClient();

  const del = useMutation({
    mutationFn: () => removeShopStaff(shopId, staff.id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-staff', shopId] });
    },
  });

  // Owner flips a barber's duty (each on-duty barber is a chair). Optimistically
  // update the roster so the switch responds instantly, then refresh the roster
  // and the live board (chair count changes).
  const duty = useMutation({
    mutationFn: (next) => setStaffDuty(shopId, staff.id, next, token),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ['shop-staff', shopId] });
      const prev = queryClient.getQueryData(['shop-staff', shopId]);
      queryClient.setQueryData(['shop-staff', shopId], (old) =>
        old?.map((s) => (s.id === staff.id ? { ...s, onDuty: next } : s)),
      );
      return { prev };
    },
    onError: (_e, _next, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['shop-staff', shopId], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-staff', shopId] });
      queryClient.invalidateQueries({ queryKey: ['queue', shopId] });
    },
  });

  const onDuty = !!staff.onDuty;

  return (
    <Box
      component={motion.div}
      layout
      variants={staggerItem}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      sx={{
        borderRadius: 2,
        p: 1.75,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 3,
        border: '1px solid',
        borderColor: justAdded ? 'rgba(200,155,60,0.65)' : 'rgba(200,155,60,0.16)',
        transition: 'box-shadow 200ms, border-color 200ms',
        opacity: del.isPending ? 0.5 : 1,
        '&:hover': { boxShadow: '0 16px 30px -14px rgba(0,0,0,0.65)', borderColor: 'rgba(200,155,60,0.4)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 46,
            height: 46,
            flexShrink: 0,
            borderRadius: '50%',
            bgcolor: 'rgba(200,155,60,0.14)',
            border: '1px solid rgba(200,155,60,0.4)',
            color: 'primary.dark',
          }}
        >
          <Typography className="font-display" sx={{ fontSize: 17, lineHeight: 1 }}>
            {initialsOf(staff.name)}
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }} noWrap>{staff.name}</Typography>
          <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 12, color: 'text.secondary' }}>
            <Phone size={12} aria-hidden="true" /> {staff.phone}
          </Typography>
        </Box>

        <IconButton
          onClick={onResetPin}
          aria-label={`Reset PIN for ${staff.name}`}
          size="small"
          component={motion.button}
          whileTap={{ scale: 0.85 }}
          sx={{ color: 'text.secondary', flexShrink: 0, '&:hover': { color: 'primary.dark', bgcolor: 'transparent' } }}
        >
          <KeyRound size={16} />
        </IconButton>

        {isAdmin && (
          <IconButton
            onClick={() => del.mutate()}
            disabled={del.isPending}
            aria-label={`Remove ${staff.name}`}
            size="small"
            component={motion.button}
            whileTap={{ scale: 0.85 }}
            sx={{ color: 'text.secondary', flexShrink: 0, '&:hover': { color: 'secondary.main', bgcolor: 'transparent' } }}
          >
            <Trash2 size={17} />
          </IconButton>
        )}
      </Box>

      {/* Duty row — each on-duty barber opens one chair for this shop. */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mt: 1.25,
          pt: 1.25,
          borderTop: '1px dashed rgba(107,93,79,0.25)',
        }}
      >
        <Box
          component={motion.span}
          animate={{ color: onDuty ? '#3F7A57' : '#8A7A68' }}
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          <Armchair size={15} aria-hidden="true" />
          <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
            {onDuty ? 'On duty · chair open' : 'Off duty'}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <DutyToggle
          size="sm"
          checked={onDuty}
          pending={duty.isPending}
          onChange={(next) => duty.mutate(next)}
        />
      </Box>
    </Box>
  );
}

// Shared by both /admin/shops/:shopId/staff and /owner/shops/:shopId — the API
// already scopes what a caller can see/do, so the same screen works for either
// role. Only the DashboardShell role label and the back-button destination differ.
export default function ShopStaff() {
  const { shopId } = useParams();
  const token = useSelector(selectToken);
  const role = useSelector(selectRole);
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resettingPin, setResettingPin] = useState(null);
  const [justAddedId, setJustAddedId] = useState(null);
  const [toast, setToast] = useState('');

  const shopQuery = useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => getShop(shopId, token),
    enabled: !!token && !!shopId,
  });
  const staffQuery = useQuery({
    queryKey: ['shop-staff', shopId],
    queryFn: () => getShopStaff(shopId, token),
    enabled: !!token && !!shopId,
  });

  const shop = shopQuery.data;
  const staffList = staffQuery.data ?? [];
  const hasStaff = staffList.length > 0;
  const meta = shop ? getShopType(shop.type) : null;
  const TypeIcon = meta?.icon ?? Scissors;
  const st = shop ? getStatusStyle(shop.status) : null;

  function goBack() {
    if (role === 'ADMIN') {
      navigate(shop ? `/admin/owners/${shop.ownerId}` : '/admin');
    } else {
      navigate('/owner/shops');
    }
  }

  function handleCreated(staff) {
    setJustAddedId(staff.id);
    setToast(`${staff.name} registered`);
    setTimeout(() => setJustAddedId(null), 2600);
  }

  function handlePinSaved(staff) {
    setToast(`PIN reset for ${staff.name}`);
  }

  return (
    <PageTransition>
      <DashboardShell roleKey={role ?? 'ADMIN'}>
        <BackButton
          label={role === 'ADMIN' ? 'Back to shops' : 'My shops'}
          onClick={goBack}
        />

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
                  {meta.label}
                </Typography>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 0.85, py: 0.25, borderRadius: 999, bgcolor: st.bg, color: st.color }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: st.dot }} />
                  <Typography sx={{ fontSize: 10, fontWeight: 700 }}>{st.label}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {shop && role === 'ADMIN' && (
          <Box
            component={motion.button}
            type="button"
            onClick={() => navigate(`/admin/shops/${shopId}`)}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.97 }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 2,
              cursor: 'pointer',
              color: 'primary.dark',
              bgcolor: 'transparent',
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              '&:hover': { color: 'primary.main' },
            }}
          >
            <Sparkles size={14} /> Manage services <ArrowRight size={14} />
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
          <Typography
            className="font-signage"
            sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'text.secondary' }}
          >
            Staff · {staffList.length}
          </Typography>
          {hasStaff && (
            <ShimmerButton onClick={() => setDialogOpen(true)} className="!px-4 !py-2.5 text-[13px]">
              <UserPlus size={16} /> Register Staff
            </ShimmerButton>
          )}
        </Box>

        {shopQuery.isError ? (
          <Typography sx={{ color: 'error.main', py: 2 }}>
            Couldn't load this shop: {shopQuery.error?.message ?? 'unknown error'}
          </Typography>
        ) : staffQuery.isPending || shopQuery.isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={24} sx={{ color: 'primary.main' }} />
          </Box>
        ) : !hasStaff ? (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            sx={{ textAlign: 'center', py: 5, px: 2 }}
          >
            <Box
              component={motion.div}
              animate={{ y: [0, -8, 0], rotate: [0, -6, 0] }}
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
              <UserPlus size={30} aria-hidden="true" />
            </Box>
            <Typography className="font-display" sx={{ fontSize: 26, color: '#F3ECDF', lineHeight: 1.1 }}>
              No staff yet
            </Typography>
            <Typography sx={{ mt: 0.5, mb: 2.5, fontSize: 14, color: 'text.secondary' }}>
              Register the barbers working at {shop?.name ?? 'this shop'}.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ShimmerButton onClick={() => setDialogOpen(true)} className="text-[15px]">
                <UserPlus size={18} /> Register Staff
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
              {staffList.map((staff) => (
                <StaffCard
                  key={staff.id}
                  staff={staff}
                  shopId={shopId}
                  isAdmin={role === 'ADMIN'}
                  justAdded={staff.id === justAddedId}
                  onResetPin={() => setResettingPin(staff)}
                />
              ))}
            </AnimatePresence>
          </Box>
        )}

        {shop && (
          <AddStaffDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            shopId={shopId}
            shopName={shop.name}
            onCreated={handleCreated}
          />
        )}

        <ResetStaffPinDialog
          open={!!resettingPin}
          staff={resettingPin}
          shopId={shopId}
          onClose={() => setResettingPin(null)}
          onSaved={handlePinSaved}
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
