import { motion } from 'framer-motion';
import { useQueries } from '@tanstack/react-query';
import { Box, Typography } from '@mui/material';
import { Store, DoorOpen, Users, Clock, Scissors } from 'lucide-react';
import { getQueueStatus } from '../api/queue';
import { staggerContainer, staggerItem } from '../lib/motion';
import AnimatedNumber from './AnimatedNumber';

// One animated stat tile: brass icon, count-up value, label. Staggered in.
function StatCard({ icon: Icon, value, unit, label, live }) {
  return (
    <Box
      component={motion.div}
      variants={staggerItem}
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
        // Tiny "live" dot so it's clear these two update in real time.
        <Box
          component={motion.span}
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: 'success.main',
          }}
        />
      )}
      <Box sx={{ mb: 0.5, color: 'primary.dark' }}>
        <Icon size={18} aria-hidden="true" />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Box className="font-display" sx={{ fontSize: 32, lineHeight: 1, color: 'primary.dark' }}>
          {value === null ? (
            <Box component="span" sx={{ color: 'text.secondary' }}>—</Box>
          ) : (
            <AnimatedNumber value={value} />
          )}
        </Box>
        {value !== null && unit && (
          <Box
            component="span"
            sx={{
              fontFamily: (t) => t.typography.fontFamily,
              fontSize: 13,
              fontWeight: 600,
              color: 'text.secondary',
            }}
          >
            {unit}
          </Box>
        )}
      </Box>
      <Typography sx={{ mt: 0.25, fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
    </Box>
  );
}

/*
 * Live at-a-glance stats for the signed-in owner, aggregated across their shops.
 * Shop counts come straight from the shops list; "waiting" / "longest wait" /
 * "now serving" are summed from each OPEN shop's live queue board (polled), and
 * degrade to "—" if a board can't be read.
 */
export default function OwnerStatsPanel({ shops = [], token }) {
  const openShops = shops.filter((s) => s.status === 'OPEN');

  const boards = useQueries({
    queries: openShops.map((s) => ({
      queryKey: ['queue', s.id],
      queryFn: () => getQueueStatus(s.id, token),
      enabled: !!token,
      refetchInterval: 5000,
    })),
  });

  const total = shops.length;
  const openCount = openShops.length;
  const anyLoaded = boards.some((b) => b.isSuccess);

  const waiting = anyLoaded
    ? boards.reduce((sum, b) => sum + (b.data?.totalWaiting ?? 0), 0)
    : null;
  const longest = anyLoaded
    ? boards.reduce((max, b) => Math.max(max, b.data?.estimatedWaitMinutes ?? 0), 0)
    : null;
  const serving = anyLoaded
    ? boards.reduce((n, b) => n + (b.data?.serving ? 1 : 0), 0)
    : null;

  return (
    <Box
      component={motion.div}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 1.25,
      }}
    >
      <StatCard icon={Store} value={total} label="Total shops" />
      <StatCard icon={DoorOpen} value={openCount} label="Open now" />
      <StatCard icon={Users} value={waiting} label="Customers waiting" live />
      <StatCard icon={Clock} value={longest} unit="min" label="Longest wait" live />
      <StatCard icon={Scissors} value={serving} label="Now serving" live />
    </Box>
  );
}
