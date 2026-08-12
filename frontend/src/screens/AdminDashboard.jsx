import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress, Snackbar, Typography } from '@mui/material';
import { Users, ChevronRight, Store, UserPlus, CheckCircle2 } from 'lucide-react';
import DashboardShell from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import ShimmerButton from '../components/ShimmerButton';
import RegisterOwnerDialog from '../components/RegisterOwnerDialog';
import { getOwners } from '../api/owners';
import { selectToken } from '../store/authSlice';
import { staggerContainer, staggerItem } from '../lib/motion';

function initialsOf(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function OwnerCard({ owner, justAdded, onOpen }) {
  return (
    <Box
      component={motion.button}
      type="button"
      onClick={onOpen}
      variants={staggerItem}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      sx={{
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 1,
        borderRadius: 2,
        p: 1.75,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 3,
        border: '1px solid',
        borderColor: justAdded ? 'rgba(200,155,60,0.65)' : 'rgba(200,155,60,0.16)',
        transition: 'box-shadow 200ms, border-color 200ms',
        '&:hover': {
          boxShadow: '0 16px 30px -14px rgba(0,0,0,0.65)',
          borderColor: 'rgba(200,155,60,0.4)',
        },
        '&:hover .chev': { transform: 'translateX(3px)', color: '#A67C2E' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
      {/* Monogram token */}
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: '50%',
          bgcolor: 'rgba(200,155,60,0.16)',
          border: '1px solid rgba(200,155,60,0.4)',
          color: 'primary.dark',
        }}
        className="font-display"
      >
        <Typography className="font-display" sx={{ fontSize: 18, lineHeight: 1 }}>
          {initialsOf(owner.name)}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700 }} noWrap>
          {owner.name}
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
          {owner.email}
        </Typography>
      </Box>

      {/* Shop-count pill */}
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.5,
          borderRadius: 999,
          bgcolor: 'rgba(27,21,18,0.06)',
          color: 'text.secondary',
          flexShrink: 0,
        }}
      >
        <Store size={13} aria-hidden="true" />
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{owner.shopCount}</Typography>
      </Box>

      <ChevronRight
        size={20}
        aria-hidden="true"
        className="chev"
        style={{ color: '#6B5D4F', transition: 'transform 200ms, color 200ms' }}
      />
      </Box>

      {/* Owner id — for admins to cross-reference records */}
      <Typography
        component="div"
        sx={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 11,
          color: 'text.secondary',
          wordBreak: 'break-all',
          userSelect: 'all',
        }}
      >
        <Box component="span" sx={{ opacity: 0.7 }}>Owner ID · </Box>
        {owner.id}
      </Typography>
    </Box>
  );
}

function EmptyState({ onRegister }) {
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
        <Users size={30} aria-hidden="true" />
      </Box>
      <Typography className="font-display" sx={{ fontSize: 26, color: '#F3ECDF', lineHeight: 1.1 }}>
        No owners yet
      </Typography>
      <Typography sx={{ mt: 0.5, mb: 2.5, fontSize: 14, color: 'text.secondary' }}>
        Register your first shop owner to start onboarding shops.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <ShimmerButton onClick={onRegister} className="text-[15px]">
          <UserPlus size={18} />
          Register Shop Owner
        </ShimmerButton>
      </Box>
    </Box>
  );
}

export default function AdminDashboard() {
  const token = useSelector(selectToken);
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [justAddedId, setJustAddedId] = useState(null);
  const [toast, setToast] = useState('');

  const ownersQuery = useQuery({
    queryKey: ['owners'],
    queryFn: () => getOwners(token),
    enabled: !!token,
  });

  const owners = ownersQuery.data ?? [];
  const hasOwners = owners.length > 0;

  function handleCreated(owner) {
    setJustAddedId(owner.id);
    setToast(`${owner.name} registered`);
    setTimeout(() => setJustAddedId(null), 2600);
  }

  return (
    <PageTransition>
      <DashboardShell roleKey="SUPER_ADMIN">
        {/* Header row: count + register CTA */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
          <Typography
            className="font-signage"
            sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'text.secondary' }}
          >
            Shop owners · {owners.length}
          </Typography>
          {hasOwners && (
            <ShimmerButton onClick={() => setDialogOpen(true)} className="!px-4 !py-2.5 text-[13px]">
              <UserPlus size={16} />
              Register
            </ShimmerButton>
          )}
        </Box>

        {ownersQuery.isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={24} sx={{ color: 'primary.main' }} />
          </Box>
        ) : ownersQuery.isError ? (
          <Typography sx={{ color: 'error.main', py: 2 }}>
            Couldn’t load owners: {ownersQuery.error?.message ?? 'unknown error'}
          </Typography>
        ) : !hasOwners ? (
          <EmptyState onRegister={() => setDialogOpen(true)} />
        ) : (
          <Box
            component={motion.div}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 3 }}
          >
            <AnimatePresence initial={false}>
              {owners.map((owner) => (
                <OwnerCard
                  key={owner.id}
                  owner={owner}
                  justAdded={owner.id === justAddedId}
                  onOpen={() => navigate(`/admin/owners/${owner.id}`)}
                />
              ))}
            </AnimatePresence>
          </Box>
        )}

        <RegisterOwnerDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
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
