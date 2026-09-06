import { motion, AnimatePresence } from 'framer-motion';
import { Box, Chip, Typography } from '@mui/material';
import { Armchair, Scissors, PowerOff } from 'lucide-react';
import { serviceLabel } from '../config/services';
import { tileGrid, tileItem } from '../lib/motion';

const SectionLabel = ({ children }) => (
  <Typography
    className="font-signage"
    sx={{ mb: 1.5, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'text.secondary' }}
  >
    {children}
  </Typography>
);

// One barber chair. `entry` present → occupied (shows the customer being served);
// null → free and waiting for the next customer.
function Chair({ index, entry }) {
  const occupied = !!entry;
  return (
    <Box
      component={motion.div}
      variants={tileItem}
      layout
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        p: 1.75,
        minHeight: 118,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: occupied ? 'background.paper' : 'rgba(243,236,223,0.03)',
        color: 'text.primary',
        boxShadow: occupied ? 6 : 0,
        border: occupied ? '2px solid' : '2px dashed',
        borderColor: occupied ? 'primary.main' : 'rgba(243,236,223,0.18)',
        transition: 'border-color 200ms, box-shadow 200ms',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: '50%',
            bgcolor: occupied ? 'rgba(200,155,60,0.16)' : 'rgba(243,236,223,0.06)',
            border: '1px solid',
            borderColor: occupied ? 'rgba(200,155,60,0.45)' : 'rgba(243,236,223,0.15)',
            color: occupied ? 'primary.dark' : 'text.secondary',
          }}
        >
          <Armchair size={18} aria-hidden="true" />
        </Box>
        <Typography
          className="font-signage"
          sx={{ flex: 1, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'text.secondary' }}
        >
          Chair {index + 1}
        </Typography>
        {occupied ? (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'secondary.main' }}>
            <Box
              component={motion.span}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'secondary.main' }}
            />
            <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Serving
            </Typography>
          </Box>
        ) : (
          <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary' }}>
            Free
          </Typography>
        )}
      </Box>

      <AnimatePresence mode="wait" initial={false}>
        {occupied ? (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <Typography className="font-display" sx={{ fontSize: 40, lineHeight: 0.9, color: 'primary.dark' }}>
              #{entry.token}
            </Typography>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }} noWrap>
                {entry.customerName || 'Walk-in'}
              </Typography>
              <Chip
                label={serviceLabel(entry.service)}
                size="small"
                sx={{ mt: 0.5, bgcolor: 'rgba(123,45,45,0.12)', color: 'secondary.main', fontWeight: 600, height: 22 }}
              />
            </Box>
          </motion.div>
        ) : (
          <motion.div
            key="free"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, color: '#C9BCA8' }}
          >
            <Scissors size={18} style={{ opacity: 0.55, flexShrink: 0 }} aria-hidden="true" />
            <Typography sx={{ fontSize: 13, color: '#C9BCA8' }}>
              Open — press “Next customer”.
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

// The shop's chairs. `chairCount` is the board's onDutyStaffCount (one chair per
// on-duty barber); `serving` fills them in order, the rest show as free.
export default function ChairsBoard({ chairCount = 0, serving = [] }) {
  const occupied = serving.length;

  if (chairCount === 0) {
    return (
      <Box sx={{ mb: 1 }}>
        <SectionLabel>Chairs</SectionLabel>
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderRadius: 3,
            p: 2,
            border: '2px dashed rgba(243,236,223,0.18)',
            color: 'text.secondary',
          }}
        >
          <PowerOff size={22} style={{ opacity: 0.7, flexShrink: 0 }} aria-hidden="true" />
          <Typography sx={{ fontSize: 14, color: '#C9BCA8' }}>
            No chairs open — no barber is on duty. Go on duty to start serving.
          </Typography>
        </Box>
      </Box>
    );
  }

  const chairs = Array.from({ length: chairCount }, (_, i) => serving[i] ?? null);

  return (
    <Box sx={{ mb: 1 }}>
      <SectionLabel>
        Chairs · {occupied}/{chairCount} serving
      </SectionLabel>
      <Box
        component={motion.div}
        variants={tileGrid}
        initial="hidden"
        animate="show"
        sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 1.25 }}
      >
        {chairs.map((entry, i) => (
          <Chair key={entry ? entry.id : `empty-${i}`} index={i} entry={entry} />
        ))}
      </Box>
    </Box>
  );
}
