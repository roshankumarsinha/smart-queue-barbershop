import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowRight,
  UserPlus,
  SkipForward,
  UserX,
  Users,
  Clock,
  Armchair,
} from 'lucide-react';
import { useQueue } from '../hooks/useQueue';
import { serviceLabel } from '../config/services';
import { staggerContainer, staggerItem } from '../lib/motion';
import WalkinDialog from './WalkinDialog';
import ShimmerButton from './ShimmerButton';
import AnimatedNumber from './AnimatedNumber';
import ChairsBoard from './ChairsBoard';

const springy = { type: 'spring', stiffness: 500, damping: 34 };

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

// A stat tile with a brass lift on hover. `children` renders the value (either
// an AnimatedNumber that rolls, or a popping string).
function StatTile({ icon: Icon, label, children }) {
  return (
    <Box
      component={motion.div}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      sx={{
        borderRadius: 2,
        p: 1.75,
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
      <Box sx={{ mb: 0.5, color: 'primary.dark' }}>
        <Icon size={18} aria-hidden="true" />
      </Box>
      <Box
        className="font-display"
        sx={{ fontSize: 32, lineHeight: 1, color: 'primary.dark' }}
      >
        {children}
      </Box>
      <Typography sx={{ mt: 0.25, fontSize: 12, color: 'text.secondary' }}>
        {label}
      </Typography>
    </Box>
  );
}

function ServiceChip({ service }) {
  return (
    <Chip
      label={serviceLabel(service)}
      size="small"
      sx={{
        bgcolor: 'rgba(123,45,45,0.12)',
        color: 'secondary.main',
        fontWeight: 600,
        height: 22,
      }}
    />
  );
}

function WaitingRow({ entry, index, canNoShow, onSkip, onNoShow, busy }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, x: -24, height: 0 }}
      transition={springy}
      style={{ listStyle: 'none' }}
    >
      <Box
        component={motion.div}
        whileHover={{ x: 4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderRadius: 2,
          px: 1.5,
          py: 1.25,
          mb: 1,
          bgcolor: 'rgba(243,236,223,0.06)',
          border: '1px solid rgba(243,236,223,0.1)',
          transition: 'background-color 200ms, border-color 200ms',
          '&:hover': {
            bgcolor: 'rgba(200,155,60,0.1)',
            borderColor: 'rgba(200,155,60,0.35)',
          },
        }}
      >
        <Box
          className="font-display"
          sx={{
            width: 30,
            height: 30,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: 'rgba(200,155,60,0.18)',
            color: 'primary.main',
            fontSize: 17,
            lineHeight: 1,
          }}
        >
          {index + 1}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#F3ECDF' }} noWrap>
            #{entry.token} · {entry.customerName || 'Walk-in'}
          </Typography>
          <ServiceChip service={entry.service} />
        </Box>
        <Tooltip title="Skip (move to end)">
          <span>
            <IconButton
              size="small"
              onClick={onSkip}
              disabled={busy}
              sx={{ color: '#C9BCA8' }}
            >
              <SkipForward size={16} />
            </IconButton>
          </span>
        </Tooltip>
        {canNoShow && (
          <Tooltip title="Mark no-show">
            <span>
              <IconButton
                size="small"
                onClick={onNoShow}
                disabled={busy}
                sx={{ color: '#B23A32' }}
              >
                <UserX size={16} />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    </motion.li>
  );
}

function BoardSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 1.5 }}>
      <CircularProgress size={26} sx={{ color: 'primary.main' }} />
      <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
        Loading the live queue…
      </Typography>
    </Box>
  );
}

// The live queue board. `canNoShow` gates the owner-only no-show action.
// `shopId` targets a specific shop's queue (owners drilling into one of several
// shops); omitted, it falls back to the signed-in user's own shop.
export default function QueueBoard({ canNoShow = false, shopId }) {
  const { status, isPending, isError, error, next, walkin, skip, noShow } =
    useQueue(shopId);
  const [walkinOpen, setWalkinOpen] = useState(false);

  if (isPending) return <BoardSkeleton />;

  if (isError && error?.status !== 401) {
    return (
      <Typography sx={{ color: 'error.main', py: 4, textAlign: 'center' }}>
        Couldn’t load the queue: {error?.message ?? 'unknown error'}
      </Typography>
    );
  }

  // Multichair: the board returns `serving` as an array (one entry per occupied
  // chair). Normalize so a legacy single-object shape still works.
  const servingList = Array.isArray(status?.serving)
    ? status.serving
    : status?.serving
      ? [status.serving]
      : [];
  const servingCount = servingList.length;
  const chairCount = status?.onDutyStaffCount ?? 0;
  const waiting = status?.waiting ?? [];
  const totalWaiting = status?.totalWaiting ?? 0;
  const eta = status?.estimatedWaitMinutes ?? 0;
  // No free chair to seat the next customer (all on-duty barbers are busy, or
  // nobody's on duty) — "Next customer" would have nowhere to go.
  const noFreeChair = chairCount === 0 || servingCount >= chairCount;
  const nothingToServe = waiting.length === 0 || noFreeChair;
  const acting = skip.isPending || noShow.isPending;

  return (
    <Box>
      {/* Stats */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <motion.div variants={staggerItem}>
          <StatTile icon={Users} label="In queue">
            <AnimatedNumber value={totalWaiting} />
          </StatTile>
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatTile icon={Clock} label="Est. wait">
            <AnimatedNumber value={eta} />
            <Box
              component="span"
              sx={{
                ml: 0.5,
                fontFamily: (t) => t.typography.fontFamily,
                fontSize: 14,
                fontWeight: 600,
                color: 'text.secondary',
              }}
            >
              min
            </Box>
          </StatTile>
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatTile icon={Armchair} label="Chairs open">
            <AnimatedNumber value={chairCount} />
          </StatTile>
        </motion.div>
      </motion.div>

      {/* Chairs — one per on-duty barber; occupied chairs show who's being served. */}
      <ChairsBoard chairCount={chairCount} serving={servingList} />

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1.5, my: 3 }}>
        <ShimmerButton
          onClick={() => next.mutate()}
          disabled={next.isPending || nothingToServe}
          className="flex-1"
        >
          {next.isPending ? (
            <>
              <CircularProgress size={16} sx={{ color: '#241A14' }} />
              Working…
            </>
          ) : (
            <>
              Next customer
              <ArrowRight size={18} />
            </>
          )}
        </ShimmerButton>
        <Button
          component={motion.button}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          onClick={() => setWalkinOpen(true)}
          variant="outlined"
          disableElevation
          startIcon={<UserPlus size={18} />}
          className="font-signage"
          sx={{
            py: 1.25,
            px: 2.5,
            whiteSpace: 'nowrap',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'primary.main',
            borderColor: 'primary.main',
            borderWidth: 2,
            '&:hover': { borderWidth: 2, borderColor: 'primary.dark', bgcolor: 'rgba(200,155,60,0.1)' },
          }}
        >
          Walk-in
        </Button>
      </Box>

      {/* Waiting list */}
      <SectionLabel>Waiting · {totalWaiting}</SectionLabel>
      <Box component={motion.ul} layout sx={{ listStyle: 'none', p: 0, m: 0 }}>
        <AnimatePresence initial={false}>
          {waiting.map((entry, index) => (
            <WaitingRow
              key={entry.id}
              entry={entry}
              index={index}
              canNoShow={canNoShow}
              busy={acting}
              onSkip={() => skip.mutate(entry.id)}
              onNoShow={() => noShow.mutate(entry.id)}
            />
          ))}
        </AnimatePresence>
        {waiting.length === 0 && (
          <Typography
            sx={{ py: 3, textAlign: 'center', fontSize: 14, color: 'text.secondary' }}
          >
            No one waiting right now.
          </Typography>
        )}
      </Box>

      <WalkinDialog
        open={walkinOpen}
        pending={walkin.isPending}
        onClose={() => setWalkinOpen(false)}
        onSubmit={(data) =>
          walkin.mutate(data, { onSuccess: () => setWalkinOpen(false) })
        }
      />
    </Box>
  );
}
