import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, CircularProgress, IconButton, Snackbar, Typography } from '@mui/material';
import { ArrowLeft, Plus, Sparkles, Trash2, Pencil, CheckCircle2 } from 'lucide-react';
import DashboardShell from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import ShimmerButton from '../components/ShimmerButton';
import AddServiceDialog from '../components/AddServiceDialog';
import EditServiceDialog from '../components/EditServiceDialog';
import { getShop } from '../api/shops';
import { getShopServices, deleteShopService } from '../api/services';
import { selectToken } from '../store/authSlice';
import { getShopType } from '../config/shopTypes';
import { getStatusStyle } from '../config/shopStatus';
import { staggerContainer, staggerItem } from '../lib/motion';

function ServiceCard({ shopId, service, justAdded, onEdit }) {
  const token = useSelector(selectToken);
  const queryClient = useQueryClient();

  const del = useMutation({
    mutationFn: () => deleteShopService(shopId, service.id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-services', shopId] });
      queryClient.invalidateQueries({ queryKey: ['shop-services-available', shopId] });
    },
  });

  return (
    <Box
      component={motion.div}
      layout
      variants={staggerItem}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
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
      {/* Estimated-time badge — the figure the queue will use. */}
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
        <Typography className="font-display" sx={{ fontSize: 18, lineHeight: 1 }}>
          {service.estimatedMinutes}
          <Box component="span" sx={{ fontSize: 11 }}>m</Box>
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700 }} noWrap>{service.label}</Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          {service.price != null ? `₹${service.price}` : 'No price set'} · ~{service.estimatedMinutes} min
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <IconButton
          onClick={() => onEdit(service)}
          disabled={del.isPending}
          aria-label={`Edit ${service.label}`}
          size="small"
          component={motion.button}
          whileTap={{ scale: 0.85 }}
          sx={{ color: 'text.secondary', '&:hover': { color: 'primary.dark', bgcolor: 'transparent' } }}
        >
          <Pencil size={16} />
        </IconButton>
        <IconButton
          onClick={() => del.mutate()}
          disabled={del.isPending}
          aria-label={`Remove ${service.label}`}
          size="small"
          component={motion.button}
          whileTap={{ scale: 0.85 }}
          sx={{ color: 'text.secondary', '&:hover': { color: 'secondary.main', bgcolor: 'transparent' } }}
        >
          <Trash2 size={17} />
        </IconButton>
      </Box>
    </Box>
  );
}

export default function ShopServices() {
  const { shopId } = useParams();
  const token = useSelector(selectToken);
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [justAddedId, setJustAddedId] = useState(null);
  const [toast, setToast] = useState('');

  const shopQuery = useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => getShop(shopId, token),
    enabled: !!token && !!shopId,
  });
  const servicesQuery = useQuery({
    queryKey: ['shop-services', shopId],
    queryFn: () => getShopServices(shopId, token),
    enabled: !!token && !!shopId,
  });

  const shop = shopQuery.data;
  const services = servicesQuery.data ?? [];
  const hasServices = services.length > 0;
  const meta = shop ? getShopType(shop.type) : null;
  const TypeIcon = meta?.icon ?? Sparkles;
  const st = shop ? getStatusStyle(shop.status) : null;

  function handleCreated(service) {
    setJustAddedId(service.id);
    setToast(`${service.label} added`);
    setTimeout(() => setJustAddedId(null), 2600);
  }

  function handleSaved(service) {
    setJustAddedId(service.id);
    setToast(`${service.label} updated`);
    setTimeout(() => setJustAddedId(null), 2600);
  }

  return (
    <PageTransition>
      <DashboardShell roleKey="SUPER_ADMIN">
        {/* Back */}
        <Box
          component={motion.button}
          type="button"
          onClick={() => navigate(shop ? `/admin/owners/${shop.ownerId}` : '/admin')}
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
          <ArrowLeft size={16} /> Back to shops
        </Box>

        {/* Shop banner */}
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

        {/* Section header + add */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
          <Typography
            className="font-signage"
            sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'text.secondary' }}
          >
            Services · {services.length}
          </Typography>
          {hasServices && (
            <ShimmerButton onClick={() => setDialogOpen(true)} className="!px-4 !py-2.5 text-[13px]">
              <Plus size={16} /> Add Service
            </ShimmerButton>
          )}
        </Box>

        {shopQuery.isError ? (
          <Typography sx={{ color: 'error.main', py: 2 }}>
            Couldn’t load this shop: {shopQuery.error?.message ?? 'unknown error'}
          </Typography>
        ) : servicesQuery.isPending || shopQuery.isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={24} sx={{ color: 'primary.main' }} />
          </Box>
        ) : !hasServices ? (
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
              <Sparkles size={30} aria-hidden="true" />
            </Box>
            <Typography className="font-display" sx={{ fontSize: 26, color: '#F3ECDF', lineHeight: 1.1 }}>
              No services yet
            </Typography>
            <Typography sx={{ mt: 0.5, mb: 2.5, fontSize: 14, color: 'text.secondary' }}>
              Add the services this {meta?.label?.toLowerCase() ?? 'shop'} offers — their time drives the queue.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ShimmerButton onClick={() => setDialogOpen(true)} className="text-[15px]">
                <Plus size={18} /> Add a Service
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
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  shopId={shopId}
                  service={service}
                  justAdded={service.id === justAddedId}
                  onEdit={setEditing}
                />
              ))}
            </AnimatePresence>
          </Box>
        )}

        {shop && (
          <AddServiceDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            shopId={shopId}
            shopType={shop.type}
            shopName={shop.name}
            onCreated={handleCreated}
          />
        )}

        <EditServiceDialog
          open={!!editing}
          service={editing}
          shopId={shopId}
          shopType={shop?.type}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
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
