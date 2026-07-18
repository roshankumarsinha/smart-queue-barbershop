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
  Scissors,
} from 'lucide-react';
import { useQueue } from '../hooks/useQueue';
import { serviceLabel } from '../config/services';
import { staggerContainer, staggerItem } from '../lib/motion';
import WalkinDialog from './WalkinDialog';

const springy = { type: 'spring', stiffness: 500, damping: 34 };

function SectionLabel({ children }) {
  return (
    <Typography
      sx={{
        mb: 1.5,
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'text.secondary',
      }}
    >
      {children}
    </Typography>
  );
}

// A stat tile whose number pops whenever it changes.
function StatTile({ icon: Icon, label, value }) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        p: 1.75,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 3,
      }}
    >
      <Box sx={{ mb: 0.5, color: 'primary.dark' }}>
        <Icon size={18} aria-hidden="true" />
      </Box>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={String(value)}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <Typography sx={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>
            {value}
          </Typography>
        </motion.div>
      </AnimatePresence>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
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

function ServingCard({ entry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -14, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Box
        sx={{
          borderRadius: 3,
          p: 2.5,
          bgcolor: 'background.paper',
          color: 'text.primary',
          border: '2px solid',
          borderColor: 'primary.main',
          boxShadow: 6,
        }}
      >
        <Typography
          sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary' }}
        >
          Now serving
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
          <Typography sx={{ fontSize: 34, fontWeight: 800, color: 'primary.dark' }}>
            #{entry.token}
          </Typography>
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
              {entry.customerName || 'Walk-in'}
            </Typography>
            <ServiceChip service={entry.service} />
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}

function EmptyServing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Box
        sx={{
          borderRadius: 3,
          p: 2.5,
          textAlign: 'center',
          border: '2px dashed rgba(243,236,223,0.15)',
          color: 'text.secondary',
        }}
      >
        <Scissors size={22} style={{ opacity: 0.6 }} />
        <Typography sx={{ mt: 0.5, fontSize: 14, color: '#C9BCA8' }}>
          Chair is free — press “Next customer”.
        </Typography>
      </Box>
    </motion.div>
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
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: 'rgba(200,155,60,0.18)',
            color: 'primary.main',
            fontSize: 12,
            fontWeight: 700,
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
export default function QueueBoard({ canNoShow = false }) {
  const { status, isPending, isError, error, next, walkin, skip, noShow } =
    useQueue();
  const [walkinOpen, setWalkinOpen] = useState(false);

  if (isPending) return <BoardSkeleton />;

  if (isError && error?.status !== 401) {
    return (
      <Typography sx={{ color: 'error.main', py: 4, textAlign: 'center' }}>
        Couldn’t load the queue: {error?.message ?? 'unknown error'}
      </Typography>
    );
  }

  const serving = status?.serving ?? null;
  const waiting = status?.waiting ?? [];
  const totalWaiting = status?.totalWaiting ?? 0;
  const eta = status?.estimatedWaitMinutes ?? 0;
  const nothingToServe = !serving && waiting.length === 0;
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
          <StatTile icon={Users} label="In queue" value={totalWaiting} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatTile icon={Clock} label="Est. wait" value={`${eta}m`} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatTile
            icon={Scissors}
            label="Serving"
            value={serving ? `#${serving.token}` : '—'}
          />
        </motion.div>
      </motion.div>

      {/* Now serving */}
      <AnimatePresence mode="wait">
        {serving ? (
          <ServingCard key={serving.id} entry={serving} />
        ) : (
          <EmptyServing key="empty" />
        )}
      </AnimatePresence>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1.5, my: 3 }}>
        <Button
          component={motion.button}
          whileTap={{ scale: 0.97 }}
          onClick={() => next.mutate()}
          disabled={next.isPending || nothingToServe}
          variant="contained"
          color="primary"
          disableElevation
          fullWidth
          endIcon={
            next.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <ArrowRight size={18} />
            )
          }
          sx={{ py: 1.25, fontWeight: 700 }}
        >
          Next customer
        </Button>
        <Button
          component={motion.button}
          whileTap={{ scale: 0.97 }}
          onClick={() => setWalkinOpen(true)}
          variant="outlined"
          disableElevation
          startIcon={<UserPlus size={18} />}
          sx={{
            py: 1.25,
            px: 2.5,
            whiteSpace: 'nowrap',
            fontWeight: 700,
            color: 'primary.main',
            borderColor: 'primary.main',
            '&:hover': { borderColor: 'primary.dark', bgcolor: 'rgba(200,155,60,0.08)' },
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
