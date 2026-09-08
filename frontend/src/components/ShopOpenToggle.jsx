import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography,
} from '@mui/material';
import { DoorOpen, DoorClosed, RotateCcw, AlertTriangle } from 'lucide-react';
import { openShop, closeShop } from '../api/shops';
import { selectToken } from '../store/authSlice';

// "HH:mm"/"HH:mm:ss" -> minutes since midnight, or null.
function parseHM(t) {
  if (!t) return null;
  const [h, m] = t.split(':');
  return Number(h) * 60 + Number(m);
}

// Mirrors the backend's ShopService.isWithinHours: no hours set counts as OUTSIDE
// (a simple same-day window, midnight-spanning not handled). Used to warn the owner
// that closing now will RESET the shop (an outside-hours close clears the queue).
function isWithinHours(shop, now = new Date()) {
  const o = parseHM(shop?.openingTime);
  const c = parseHM(shop?.closingTime);
  if (o == null || c == null) return false;
  const nm = now.getHours() * 60 + now.getMinutes();
  return nm >= o && nm < c;
}

const OPEN_C = { fg: '#3F7A57', glow: 'rgba(124,207,160,0.75)', bulb: '#7CCFA0', border: 'rgba(63,122,87,0.55)' };
const CLOSED_C = { fg: '#B23A32', glow: 'rgba(178,58,50,0.6)', bulb: '#B23A32', border: 'rgba(123,45,45,0.5)' };

// The hanging plaque itself — swings in from the side on each state change (low
// damping = a pendulum settle) and reads OPEN / CLOSED with a glowing bulb.
function Plaque({ open, size }) {
  const c = open ? OPEN_C : CLOSED_C;
  const Icon = open ? DoorOpen : DoorClosed;
  const lg = size === 'lg';
  return (
    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* nail + cord the sign hangs from */}
      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'rgba(200,155,60,0.8)', boxShadow: '0 0 0 2px rgba(200,155,60,0.25)' }} />
      <Box sx={{ width: 1.5, height: lg ? 9 : 6, bgcolor: 'rgba(200,155,60,0.5)' }} />
      <Box sx={{ perspective: 600 }}>
        <AnimatePresence mode="wait" initial={false}>
          <Box
            component={motion.div}
            key={open ? 'open' : 'closed'}
            initial={{ rotate: open ? -14 : 14, opacity: 0, y: -4 }}
            animate={{ rotate: 0, opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 360, damping: 11 }}
            style={{ transformOrigin: 'top center' }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: lg ? 1 : 0.75,
              px: lg ? 1.75 : 1.25,
              py: lg ? 0.85 : 0.55,
              borderRadius: 1.5,
              bgcolor: '#241A14',
              border: '1.5px solid',
              borderColor: c.border,
              boxShadow: `0 6px 14px -8px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(243,236,223,0.04)`,
            }}
          >
            <Box
              component={motion.span}
              animate={open ? { opacity: [1, 0.45, 1] } : { opacity: 1 }}
              transition={open ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
              sx={{
                width: lg ? 9 : 7,
                height: lg ? 9 : 7,
                borderRadius: '50%',
                flexShrink: 0,
                bgcolor: c.bulb,
                boxShadow: `0 0 ${lg ? 10 : 7}px ${c.glow}`,
              }}
            />
            <Icon size={lg ? 16 : 13} color={c.fg} aria-hidden="true" />
            <Typography
              className="font-signage"
              sx={{ fontSize: lg ? 14 : 11.5, fontWeight: 700, letterSpacing: '0.14em', color: c.fg, lineHeight: 1 }}
            >
              {open ? 'OPEN' : 'CLOSED'}
            </Typography>
          </Box>
        </AnimatePresence>
      </Box>
    </Box>
  );
}

/*
 * Owner-facing OPEN/CLOSED control for one shop — a little hanging shop sign that
 * swings when flipped. Self-contained: runs the open/close mutations, optimistically
 * updates the cached shop, and refreshes the live board. Closing OUTSIDE business
 * hours resets the shop (clears the queue, restarts tokens, staff off duty), so that
 * case asks for confirmation first; opening and within-hours "pause" closes are instant.
 */
export default function ShopOpenToggle({ shop, size = 'sm' }) {
  const token = useSelector(selectToken);
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isOpen = shop?.status === 'OPEN';

  const patchCaches = (nextStatus) => {
    qc.setQueryData?.(['my-shops'], (old) =>
      Array.isArray(old) ? old.map((s) => (s.id === shop.id ? { ...s, status: nextStatus } : s)) : old,
    );
    qc.setQueryData?.(['shop', shop.id], (old) => (old ? { ...old, status: nextStatus } : old));
  };

  const mutation = useMutation({
    mutationFn: (next) => (next ? openShop(shop.id, token) : closeShop(shop.id, token)),
    onMutate: (next) => {
      const prevShops = qc.getQueryData(['my-shops']);
      const prevShop = qc.getQueryData(['shop', shop.id]);
      patchCaches(next ? 'OPEN' : 'CLOSED');
      return { prevShops, prevShop };
    },
    onError: (_e, _next, ctx) => {
      if (ctx?.prevShops !== undefined) qc.setQueryData(['my-shops'], ctx.prevShops);
      if (ctx?.prevShop !== undefined) qc.setQueryData(['shop', shop.id], ctx.prevShop);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['my-shops'] });
      qc.invalidateQueries({ queryKey: ['shop', shop.id] });
      qc.invalidateQueries({ queryKey: ['queue', shop.id] });
    },
  });

  // Closing while OUTSIDE business hours is the destructive path (backend resets the
  // shop) — confirm first. Opening and within-hours pause-closes go straight through.
  const willResetOnClose = isOpen && !isWithinHours(shop);

  function handleClick() {
    if (mutation.isPending) return;
    if (willResetOnClose) {
      setConfirmOpen(true);
      return;
    }
    mutation.mutate(!isOpen);
  }

  const lg = size === 'lg';

  return (
    <>
      <Box
        component={motion.button}
        type="button"
        role="switch"
        aria-checked={isOpen}
        aria-label={isOpen ? 'Shop is open — tap to close' : 'Shop is closed — tap to open'}
        onClick={handleClick}
        disabled={mutation.isPending}
        whileHover={mutation.isPending ? undefined : { y: -2 }}
        whileTap={mutation.isPending ? undefined : { scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        sx={{
          position: 'relative',
          p: lg ? 0.5 : 0.25,
          border: 'none',
          bgcolor: 'transparent',
          cursor: mutation.isPending ? 'default' : 'pointer',
          lineHeight: 0,
          opacity: mutation.isPending ? 0.65 : 1,
          // a soft nudge-swing on hover, as if bumped
          '&:hover': mutation.isPending ? {} : { filter: 'brightness(1.05)' },
        }}
      >
        <Plaque open={isOpen} size={size} />
        {mutation.isPending && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <CircularProgress size={lg ? 20 : 15} sx={{ color: 'primary.main' }} />
          </Box>
        )}
      </Box>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{
          sx: { bgcolor: '#241A14', color: '#F3ECDF', border: '1px solid rgba(200,155,60,0.4)', borderRadius: 3, maxWidth: 380 },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <RotateCcw size={20} color="#C89B3C" />
          <Typography className="font-display" sx={{ fontSize: 26, color: '#F3ECDF', lineHeight: 1 }}>
            Close &amp; reset?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <AlertTriangle size={18} color="#E5A3A3" style={{ marginTop: 2, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 14, color: '#C9BCA8' }}>
              It's outside <b style={{ color: '#F3ECDF' }}>{shop?.name}</b>'s business hours, so closing now will{' '}
              <b style={{ color: '#F3ECDF' }}>clear the whole queue</b>, restart tokens at #1, and take all staff off duty.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: '#C9BCA8', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={() => { setConfirmOpen(false); mutation.mutate(false); }}
            variant="contained"
            color="secondary"
            disableElevation
            startIcon={<RotateCcw size={16} />}
            sx={{ fontWeight: 700 }}
          >
            Close &amp; reset
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
