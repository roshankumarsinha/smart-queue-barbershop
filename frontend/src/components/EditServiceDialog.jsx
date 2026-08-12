import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Sparkles, Check } from 'lucide-react';
import TicketDialog from './TicketDialog';
import TicketField from './form/TicketField';
import ShimmerButton from './ShimmerButton';
import { updateShopService } from '../api/services';
import { selectToken } from '../store/authSlice';
import { getServiceForm } from '../config/serviceForms';

// Editing changes price / estimated time only — the service TYPE is fixed (to change
// it, remove the service and add the right one), matching the backend PATCH contract.
export default function EditServiceDialog({ open, service, shopId, shopType, onClose, onSaved }) {
  const token = useSelector(selectToken);
  const queryClient = useQueryClient();
  const form = getServiceForm(shopType);

  const [values, setValues] = useState({});
  const [label, setLabel] = useState('');
  const [errors, setErrors] = useState({});
  const [shakes, setShakes] = useState({});
  const [formError, setFormError] = useState(null);

  // Seed the form from the service whenever the dialog opens (or switches service).
  // Values live in state so they survive the dialog's close animation.
  useEffect(() => {
    if (open && service) {
      const seed = {};
      for (const f of form.fields) {
        const v = service[f.name];
        seed[f.name] = v != null ? String(v) : '';
      }
      setValues(seed);
      setLabel(service.label);
      setErrors({});
      setFormError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, service?.id]);

  const mutation = useMutation({
    mutationFn: (body) => updateShopService(shopId, service.id, body, token),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['shop-services', shopId] });
      onClose();
      onSaved?.(updated);
    },
    onError: (err) => setFormError(err.message || 'Could not save changes. Try again.'),
  });

  function handleClose() {
    if (mutation.isPending) return;
    onClose();
  }

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
    if (formError) setFormError(null);
  }

  function validate() {
    const next = {};
    for (const f of form.fields) {
      const raw = (values[f.name] ?? '').trim();
      if (f.required && raw === '') {
        next[f.name] = `${f.label} is required`;
      } else if (raw !== '' && (Number.isNaN(Number(raw)) || Number(raw) < f.min)) {
        next[f.name] = `Enter a number ≥ ${f.min}`;
      }
    }
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (mutation.isPending) return;

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setShakes((prev) => {
        const bumped = { ...prev };
        for (const k of Object.keys(next)) bumped[k] = (bumped[k] ?? 0) + 1;
        return bumped;
      });
      return;
    }

    const body = {};
    for (const f of form.fields) {
      const raw = (values[f.name] ?? '').trim();
      if (raw !== '') body[f.name] = Number(raw);
    }
    setFormError(null);
    mutation.mutate(body);
  }

  return (
    <TicketDialog
      open={open}
      onClose={handleClose}
      icon={Sparkles}
      title="Edit Service"
      subtitle={label ? `On this shop` : undefined}
    >
      <form onSubmit={handleSubmit} noValidate>
        {/* Service type is fixed — shown read-only */}
        <Typography
          component="span"
          sx={{ display: 'block', mb: 0.5, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}
        >
          Service
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.75,
            py: 1.5,
            mb: 1,
            borderRadius: 2,
            bgcolor: 'rgba(200,155,60,0.12)',
            border: '1px solid rgba(200,155,60,0.35)',
            color: 'text.primary',
          }}
        >
          <Sparkles size={16} color="#A67C2E" aria-hidden="true" />
          <Typography sx={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{label}</Typography>
          <Check size={16} color="#A67C2E" aria-hidden="true" />
        </Box>

        {form.fields.map((f) => (
          <TicketField
            key={f.name}
            name={f.name}
            label={f.label}
            icon={f.icon}
            type="number"
            inputMode="numeric"
            placeholder={f.placeholder}
            endHint={f.endHint}
            value={values[f.name] ?? ''}
            error={errors[f.name]}
            shakeSignal={shakes[f.name] ?? 0}
            onChange={setField}
          />
        ))}

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
              Save Changes
            </>
          )}
        </ShimmerButton>
      </form>
    </TicketDialog>
  );
}
