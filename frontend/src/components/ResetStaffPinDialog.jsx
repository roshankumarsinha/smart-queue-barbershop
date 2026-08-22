import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CircularProgress, Typography } from '@mui/material';
import { KeyRound, Check } from 'lucide-react';
import TicketDialog from './TicketDialog';
import TicketField from './form/TicketField';
import ShimmerButton from './ShimmerButton';
import { updateStaffPin } from '../api/staff';
import { selectToken } from '../store/authSlice';

// No "current PIN" field on purpose — this is an admin/owner resetting someone
// else's PIN (they forgot it, or a shared tablet's code needs rotating), not the
// barber confirming their own identity to change it.
export default function ResetStaffPinDialog({ open, staff, shopId, onClose, onSaved }) {
  const token = useSelector(selectToken);
  const queryClient = useQueryClient();

  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [shakeSignal, setShakeSignal] = useState(0);
  const [formError, setFormError] = useState(null);

  const mutation = useMutation({
    mutationFn: () => updateStaffPin(shopId, staff.id, { pin }, token),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['shop-staff', shopId] });
      resetForm();
      onClose();
      onSaved?.(updated);
    },
    onError: (err) => setFormError(err.message || 'Could not reset PIN. Try again.'),
  });

  function resetForm() {
    setPin('');
    setError(null);
    setFormError(null);
  }

  function handleClose() {
    if (mutation.isPending) return;
    resetForm();
    onClose();
  }

  function handleChange(_name, value) {
    setPin(value);
    if (error) setError(null);
    if (formError) setFormError(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (mutation.isPending) return;

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be 4 digits');
      setShakeSignal((s) => s + 1);
      return;
    }

    setFormError(null);
    mutation.mutate();
  }

  return (
    <TicketDialog
      open={open}
      onClose={handleClose}
      icon={KeyRound}
      title="Reset PIN"
      subtitle={staff ? `For ${staff.name}` : undefined}
    >
      <form onSubmit={handleSubmit} noValidate>
        <TicketField
          name="pin"
          label="New 4-digit PIN"
          icon={KeyRound}
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder="••••"
          value={pin}
          error={error}
          shakeSignal={shakeSignal}
          onChange={handleChange}
        />
        <Typography sx={{ mt: -1, mb: 1.5, fontSize: 12, color: 'text.secondary' }}>
          The old PIN stops working the moment this is saved.
        </Typography>

        {formError && (
          <Typography
            component={motion.p}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{ mb: 1, textAlign: 'center', fontSize: 14, fontWeight: 500, color: 'error.main' }}
          >
            {formError}
          </Typography>
        )}

        <ShimmerButton type="submit" disabled={mutation.isPending} className="mt-1 w-full text-[15px]">
          {mutation.isPending ? (
            <>
              <CircularProgress size={16} sx={{ color: '#241A14' }} />
              Saving…
            </>
          ) : (
            <>
              <Check size={18} />
              Save New PIN
            </>
          )}
        </ShimmerButton>
      </form>
    </TicketDialog>
  );
}
