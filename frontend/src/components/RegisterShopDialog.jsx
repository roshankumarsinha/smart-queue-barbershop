import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Store, MessageCircle, Phone, MapPin, Link2, DoorOpen, DoorClosed, Plus } from 'lucide-react';
import TicketDialog from './TicketDialog';
import TicketField from './form/TicketField';
import ShopTypePicker from './form/ShopTypePicker';
import ShimmerButton from './ShimmerButton';
import { createOwnerShop } from '../api/owners';
import { selectToken } from '../store/authSlice';
import { shopSchema } from '../lib/registrationSchemas';
import { validateWithSchema } from '../lib/authSchemas';
import { DEFAULT_SHOP_TYPE } from '../config/shopTypes';

const EMPTY = {
  name: '',
  whatsappNumber: '',
  phone: '',
  address: '',
  locationUrl: '',
  openingTime: '',
  closingTime: '',
};

export default function RegisterShopDialog({ open, onClose, ownerId, ownerName, onCreated }) {
  const token = useSelector(selectToken);
  const queryClient = useQueryClient();

  const [type, setType] = useState(DEFAULT_SHOP_TYPE);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [shakes, setShakes] = useState({});
  const [formError, setFormError] = useState(null);

  const mutation = useMutation({
    mutationFn: (body) => createOwnerShop(ownerId, body, token),
    onSuccess: (shop) => {
      queryClient.invalidateQueries({ queryKey: ['owner-shops', ownerId] });
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      queryClient.invalidateQueries({ queryKey: ['owner', ownerId] });
      resetForm();
      onClose(); // close directly — handleClose's in-flight guard would block this
      onCreated?.(shop);
    },
    onError: (err) => setFormError(err.message || 'Could not register shop. Try again.'),
  });

  function handleChange(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
    if (formError) setFormError(null);
  }

  function resetForm() {
    setValues(EMPTY);
    setType(DEFAULT_SHOP_TYPE);
    setErrors({});
    setFormError(null);
  }

  // User-initiated close (X / backdrop / Escape): ignored while a submit is in flight.
  function handleClose() {
    if (mutation.isPending) return;
    resetForm();
    onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (mutation.isPending) return;

    const nextErrors = validateWithSchema(shopSchema, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setShakes((prev) => {
        const next = { ...prev };
        for (const name of Object.keys(nextErrors)) next[name] = (next[name] ?? 0) + 1;
        return next;
      });
      return;
    }

    const clean = (v) => (v.trim() ? v.trim() : undefined);
    setFormError(null);
    mutation.mutate({
      name: values.name.trim(),
      type,
      whatsappNumber: clean(values.whatsappNumber),
      phone: clean(values.phone),
      address: clean(values.address),
      locationUrl: clean(values.locationUrl),
      openingTime: clean(values.openingTime),
      closingTime: clean(values.closingTime),
    });
  }

  return (
    <TicketDialog
      open={open}
      onClose={handleClose}
      icon={Store}
      title="Register a Shop"
      subtitle={ownerName ? `Under ${ownerName}` : undefined}
    >
      <form onSubmit={handleSubmit} noValidate>
        <TicketField
          name="name"
          label="Shop name"
          icon={Store}
          placeholder="City Clips Salon"
          value={values.name}
          error={errors.name}
          shakeSignal={shakes.name ?? 0}
          onChange={handleChange}
        />

        <ShopTypePicker value={type} onChange={setType} />

        <TicketField
          name="whatsappNumber"
          label="WhatsApp number (optional)"
          icon={MessageCircle}
          type="tel"
          inputMode="tel"
          placeholder="+91 98765 43210"
          value={values.whatsappNumber}
          error={errors.whatsappNumber}
          shakeSignal={shakes.whatsappNumber ?? 0}
          onChange={handleChange}
        />

        <TicketField
          name="phone"
          label="Shop phone (optional)"
          icon={Phone}
          type="tel"
          inputMode="tel"
          placeholder="98765 43210"
          value={values.phone}
          error={errors.phone}
          shakeSignal={shakes.phone ?? 0}
          onChange={handleChange}
        />

        <TicketField
          name="address"
          label="Address (optional)"
          icon={MapPin}
          placeholder="12 Market St"
          value={values.address}
          error={errors.address}
          shakeSignal={shakes.address ?? 0}
          onChange={handleChange}
        />

        <TicketField
          name="locationUrl"
          label="Google Maps link (optional)"
          icon={Link2}
          placeholder="https://maps.google.com/?q=…"
          value={values.locationUrl}
          error={errors.locationUrl}
          shakeSignal={shakes.locationUrl ?? 0}
          onChange={handleChange}
        />

        {/* Opening / closing side by side */}
        <Box sx={{ display: 'flex', gap: 1.25 }}>
          <Box sx={{ flex: 1 }}>
            <TicketField
              name="openingTime"
              label="Opens"
              icon={DoorOpen}
              type="time"
              value={values.openingTime}
              error={errors.openingTime}
              shakeSignal={shakes.openingTime ?? 0}
              onChange={handleChange}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <TicketField
              name="closingTime"
              label="Closes"
              icon={DoorClosed}
              type="time"
              value={values.closingTime}
              error={errors.closingTime}
              shakeSignal={shakes.closingTime ?? 0}
              onChange={handleChange}
            />
          </Box>
        </Box>

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
              <Plus size={18} />
              Register Shop
            </>
          )}
        </ShimmerButton>
      </form>
    </TicketDialog>
  );
}
