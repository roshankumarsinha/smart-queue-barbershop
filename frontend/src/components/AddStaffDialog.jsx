import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CircularProgress, Typography } from '@mui/material';
import { UserPlus, User, Phone, KeyRound } from 'lucide-react';
import TicketDialog from './TicketDialog';
import TicketField from './form/TicketField';
import ShimmerButton from './ShimmerButton';
import { addShopStaff } from '../api/staff';
import { selectToken } from '../store/authSlice';
import { staffSchema } from '../lib/registrationSchemas';
import { validateWithSchema } from '../lib/authSchemas';

const EMPTY = { name: '', phone: '', pin: '' };

export default function AddStaffDialog({ open, onClose, shopId, shopName, onCreated }) {
  const token = useSelector(selectToken);
  const queryClient = useQueryClient();

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [shakes, setShakes] = useState({});
  const [formError, setFormError] = useState(null);

  const mutation = useMutation({
    mutationFn: (body) => addShopStaff(shopId, body, token),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['shop-staff', shopId] });
      resetForm();
      onClose(); // close directly — handleClose's in-flight guard would block this
      onCreated?.(created);
    },
    onError: (err) => setFormError(err.message || 'Could not register staff. Try again.'),
  });

  function handleChange(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
    if (formError) setFormError(null);
  }

  function resetForm() {
    setValues(EMPTY);
    setErrors({});
    setFormError(null);
  }

  function handleClose() {
    if (mutation.isPending) return;
    resetForm();
    onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (mutation.isPending) return;

    const nextErrors = validateWithSchema(staffSchema, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setShakes((prev) => {
        const next = { ...prev };
        for (const name of Object.keys(nextErrors)) next[name] = (next[name] ?? 0) + 1;
        return next;
      });
      return;
    }

    setFormError(null);
    mutation.mutate({
      name: values.name.trim(),
      phone: values.phone.trim(),
      pin: values.pin,
    });
  }

  return (
    <TicketDialog
      open={open}
      onClose={handleClose}
      icon={UserPlus}
      title="Register Staff"
      subtitle={shopName ? `At ${shopName}` : undefined}
    >
      <form onSubmit={handleSubmit} noValidate>
        <TicketField
          name="name"
          label="Staff name"
          icon={User}
          placeholder="Deepak Kumar"
          value={values.name}
          error={errors.name}
          shakeSignal={shakes.name ?? 0}
          onChange={handleChange}
        />

        <TicketField
          name="phone"
          label="Phone number"
          icon={Phone}
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="9876543210"
          value={values.phone}
          error={errors.phone}
          shakeSignal={shakes.phone ?? 0}
          onChange={handleChange}
        />

        <TicketField
          name="pin"
          label="4-digit PIN"
          icon={KeyRound}
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder="••••"
          value={values.pin}
          error={errors.pin}
          shakeSignal={shakes.pin ?? 0}
          onChange={handleChange}
        />
        <Typography sx={{ mt: -1, mb: 1.5, fontSize: 12, color: 'text.secondary' }}>
          This is what they'll sign in with — phone + PIN, same as the Staff login tab.
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
              Registering…
            </>
          ) : (
            <>
              <UserPlus size={18} />
              Register Staff
            </>
          )}
        </ShimmerButton>
      </form>
    </TicketDialog>
  );
}
