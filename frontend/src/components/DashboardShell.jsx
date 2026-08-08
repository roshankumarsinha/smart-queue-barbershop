import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  Typography,
} from '@mui/material';
import { Check, LogOut, Scissors } from 'lucide-react';
import { logout, selectUser } from '../store/authSlice';
import { getRole } from '../config/roles';
import { staggerContainer, staggerItem } from '../lib/motion';
import BarberPole from './BarberPole';

// A stat card (used on Owner/Admin dashboards). MUI Card, staggered in, with a
// brass lift on hover.
export function StatCard({ label, value, hint }) {
  return (
    <Card
      component={motion.div}
      variants={staggerItem}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      elevation={6}
      sx={{
        borderRadius: 2,
        border: '1px solid rgba(200,155,60,0.18)',
        transition: 'box-shadow 200ms',
        '&:hover': { boxShadow: '0 14px 28px -12px rgba(0,0,0,0.6)' },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography
          className="font-display"
          sx={{ fontSize: 34, lineHeight: 1, color: 'primary.dark' }}
        >
          {value}
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 14, fontWeight: 600, color: 'text.primary' }}>
          {label}
        </Typography>
        {hint && (
          <Typography sx={{ mt: 0.25, fontSize: 12, color: 'text.secondary' }}>
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// The role's permission list (MUI List), staggered in. Sits on the dark
// charcoal background, so text is ivory.
export function PermissionList({ permissions }) {
  return (
    <List
      component={motion.ul}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}
    >
      {permissions.map((perm) => (
        <ListItem
          key={perm}
          component={motion.li}
          variants={staggerItem}
          whileHover={{ x: 4 }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          sx={{
            borderRadius: 2,
            px: 1.5,
            py: 1,
            gap: 0,
            bgcolor: 'rgba(243,236,223,0.05)',
            border: '1px solid rgba(243,236,223,0.1)',
            transition: 'background-color 200ms, border-color 200ms',
            '&:hover': {
              bgcolor: 'rgba(200,155,60,0.1)',
              borderColor: 'rgba(200,155,60,0.35)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Check size={16} color="#3F7A57" aria-hidden="true" />
          </ListItemIcon>
          <Typography sx={{ fontSize: 14, color: '#F3ECDF' }}>{perm}</Typography>
        </ListItem>
      ))}
    </List>
  );
}

// Page chrome shared by every dashboard: top stripe, header with the signed-in
// role, and a working Log out button.
export default function DashboardShell({ roleKey, children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const role = getRole(roleKey);

  function handleLogout() {
    dispatch(logout());
    navigate('/login');
  }

  return (
    <div className="flex min-h-full flex-col">
      <BarberPole className="h-2.5 w-full" />

      <Box
        component="header"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
          <Scissors size={20} aria-hidden="true" />
          <Typography
            className="font-display"
            sx={{ fontSize: 26, lineHeight: 1, letterSpacing: '0.04em', color: '#F3ECDF' }}
          >
            Smart Queue
          </Typography>
        </Box>
        <Button
          component={motion.button}
          whileTap={{ scale: 0.96 }}
          onClick={handleLogout}
          variant="contained"
          color="secondary"
          disableElevation
          startIcon={<LogOut size={16} />}
          sx={{ fontWeight: 600 }}
        >
          Log out
        </Button>
      </Box>

      <Box component="main" className="mx-auto w-full max-w-md flex-1" sx={{ px: 2.5, pb: 5 }}>
        <Typography
          className="font-signage"
          sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'text.secondary' }}
        >
          Logged in as
        </Typography>
        <Typography
          component={motion.h1}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="font-display"
          sx={{ mb: 0.5, fontSize: 46, lineHeight: 1, letterSpacing: '0.02em', color: 'primary.main' }}
        >
          {role.title}
        </Typography>
        {user?.identifier && (
          <Typography sx={{ mb: 3, fontSize: 14, color: 'text.secondary' }}>
            {user.identifier}
          </Typography>
        )}

        {children}
      </Box>
    </div>
  );
}
