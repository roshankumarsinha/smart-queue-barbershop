import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CircularProgress, Typography } from '@mui/material';
import { Sparkles, Plus } from 'lucide-react';
import TicketDialog from './TicketDialog';
import TicketField from './form/TicketField';
import ServicePicker from './form/ServicePicker';
import ShimmerButton from './ShimmerButton';
import { getAvailableServices, addShopService } from '../api/services';
import { selectToken } from '../store/authSlice';
import { getServiceForm } from '../config/serviceForms';

export default function AddServiceDialog({ open, onClose, shopId, shopType, shopName, onCreated }) {
  const token = useSelector(selectToken);
  const queryClient = useQueryClient();
  const form = getServiceForm(shopType);

  const [service, setService] = useState('');
  const [values, setValues] = useState({}); // { estimatedMinutes, price, ... }
  const [errors, setErrors] = useState({});
  const [shakes, setShakes] = useState({});
  const [formError, setFormError] = useState(null);

  const availableQuery = useQuery({
    queryKey: ['shop-services-available', shopId],
    queryFn: () => getAvailableServices(shopId, token),
    enabled: open && !!token,
  });
  const options = availableQuery.data ?? [];
  const noneLeft = availableQuery.isSuccess && options.length === 0;

  const mutation = useMutation({
    mutationFn: (body) => addShopService(shopId, body, token),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['shop-services', shopId] });
      queryClient.invalidateQueries({ queryKey: ['shop-services-available', shopId] });
      resetForm();
      onClose();
      onCreated?.(created);
    },
    onError: (err) => setFormError(err.message || 'Could not add service. Try again.'),
  });

  function resetForm() {
    setService('');
    setValues({});
    setErrors({});
    setFormError(null);
  }

  function handleClose() {
    if (mutation.isPending) return;
    resetForm();
    onClose();
  }

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
    if (formError) setFormError(null);
  }

  function validate() {
    const next = {};
    if (!service) next.service = 'Pick a service';
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

    // Field names match the API keys; include only the ones that were filled in.
    const body = { service };
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
      title="Add a Service"
      subtitle={shopName ? `To ${shopName}` : undefined}
    >
      <form onSubmit={handleSubmit} noValidate>
        <ServicePicker
          value={service}
          options={options}
          onChange={(code) => {
            setService(code);
            setErrors((prev) => (prev.service ? { ...prev, service: null } : prev));
            if (formError) setFormError(null);
          }}
          error={errors.service}
          shakeSignal={shakes.service ?? 0}
          disabled={noneLeft}
        />

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

        <ShimmerButton type="submit" disabled={mutation.isPending || noneLeft} className="mt-1 w-full text-[15px]">
          {mutation.isPending ? (
            <>
              <CircularProgress size={16} sx={{ color: '#241A14' }} />
              Adding…
            </>
          ) : (
            <>
              <Plus size={18} />
              Add Service
            </>
          )}
        </ShimmerButton>

        {noneLeft && (
          <Typography sx={{ pt: 1.5, textAlign: 'center', fontSize: 13, color: 'text.secondary' }}>
            Every service in the catalog is already added.
          </Typography>
        )}
      </form>
    </TicketDialog>
  );
}
