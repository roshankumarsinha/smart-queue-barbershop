import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Stack,
} from '@mui/material';
import { SERVICES } from '../config/services';

// Small form for staff to add a walk-in customer to the queue.
export default function WalkinDialog({ open, onClose, onSubmit, pending }) {
  const [service, setService] = useState(SERVICES[0].value);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      service,
      name: name.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={pending ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>Add walk-in</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              select
              label="Service"
              value={service}
              onChange={(e) => setService(e.target.value)}
              fullWidth
              required
            >
              {SERVICES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              inputMode="numeric"
              placeholder="For WhatsApp updates"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={pending} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disableElevation
            disabled={pending}
            startIcon={
              pending ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{ fontWeight: 700 }}
          >
            {pending ? 'Adding…' : 'Add to queue'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
