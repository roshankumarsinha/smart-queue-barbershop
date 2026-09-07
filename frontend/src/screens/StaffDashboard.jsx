import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Snackbar, Box } from '@mui/material';
import { AlertCircle } from 'lucide-react';
import DashboardShell from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import QueueBoard from '../components/QueueBoard';
import DutyToggle from '../components/DutyToggle';
import { setStaffDuty } from '../api/staff';
import { selectToken, selectUser, setUserOnDuty } from '../store/authSlice';

export default function StaffDashboard() {
  const dispatch = useDispatch();
  const qc = useQueryClient();
  const token = useSelector(selectToken);
  const user = useSelector(selectUser);
  const onDuty = !!user?.onDuty;
  const [error, setError] = useState('');

  // A barber flips their OWN duty. Optimistically update the session (persisted,
  // so it survives reload) and roll back if the request fails. On success the
  // shop's chair count changes, so refresh the live board.
  const duty = useMutation({
    mutationFn: (next) => setStaffDuty(user.shopId, user.id, next, token),
    onMutate: (next) => {
      const prev = onDuty;
      dispatch(setUserOnDuty(next));
      return { prev };
    },
    onError: (err, _next, ctx) => {
      if (ctx) dispatch(setUserOnDuty(ctx.prev));
      setError(err?.message ?? "Couldn't update your duty status");
    },
    onSuccess: (staff) => {
      // Trust the server's value, then refresh the chairs/queue.
      dispatch(setUserOnDuty(!!staff?.onDuty));
      qc.invalidateQueries({ queryKey: ['queue', user.shopId] });
    },
  });

  return (
    <PageTransition>
      <DashboardShell roleKey="BARBER_STAFF">
        {user?.shopId && user?.id && (
          <DutyToggle
            checked={onDuty}
            pending={duty.isPending}
            onChange={(next) => duty.mutate(next)}
          />
        )}

        {/* Barbers get Next / Walk-in / Skip — but not no-show. */}
        <QueueBoard />

        <Snackbar
          open={!!error}
          autoHideDuration={3600}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          message={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AlertCircle size={18} color="#E5A3A3" />
              <span>{error}</span>
            </Box>
          }
          sx={{
            '& .MuiSnackbarContent-root': {
              bgcolor: '#241A14',
              color: '#F3ECDF',
              border: '1px solid rgba(123,45,45,0.5)',
              fontWeight: 600,
            },
          }}
        />
      </DashboardShell>
    </PageTransition>
  );
}
