import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';
import { Phone, Mail, Scissors } from 'lucide-react';
import BarberPole from './BarberPole';

// Contact handles shown as interactive chips. tel:/mailto: are user-initiated
// links (nothing is sent automatically).
const CONTACTS = [
  {
    icon: Phone,
    label: '+91 89047 61129',
    href: 'tel:+918904761129',
    aria: 'Call Smart Queue',
  },
  {
    icon: Mail,
    label: 'rpsinha7688@gmail.com',
    href: 'mailto:rpsinha7688@gmail.com',
    aria: 'Email Smart Queue',
  },
];

function ContactChip({ icon: Icon, label, href, aria, external }) {
  return (
    <Box
      component={motion.a}
      href={href}
      aria-label={aria}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1.75,
        py: 1,
        borderRadius: 2,
        textDecoration: 'none',
        bgcolor: 'rgba(243,236,223,0.05)',
        border: '1px solid rgba(243,236,223,0.12)',
        color: '#E7DDC9',
        fontSize: 14,
        fontWeight: 500,
        transition: 'background-color 200ms, border-color 200ms, color 200ms',
        '& svg': { color: 'primary.main', transition: 'color 200ms' },
        '&:hover': {
          bgcolor: 'rgba(200,155,60,0.12)',
          borderColor: 'rgba(200,155,60,0.45)',
          color: '#F3ECDF',
        },
        '&:hover svg': { color: 'primary.light' },
      }}
    >
      <Icon size={16} aria-hidden="true" />
      {label}
    </Box>
  );
}

// App-wide footer: brand mark + contact handles + copyright. Rendered once in
// App below the routes so it appears on every page. Sits on the charcoal page
// backdrop; a brass hairline separates it from the content above.
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{ position: 'relative', mt: 'auto', color: '#C9BCA8' }}
    >
      {/* Brass gradient hairline seam. */}
      <Box
        aria-hidden="true"
        sx={{
          height: '2px',
          background:
            'linear-gradient(90deg, transparent, rgba(200,155,60,0.6) 20%, rgba(231,197,107,0.9) 50%, rgba(200,155,60,0.6) 80%, transparent)',
        }}
      />

      <Box
        sx={{
          mx: 'auto',
          width: '100%',
          maxWidth: 960,
          px: 2.5,
          py: { xs: 3.5, sm: 4 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'center', md: 'flex-start' },
            justifyContent: 'space-between',
            gap: 3,
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          {/* Brand + tagline */}
          <Box sx={{ maxWidth: 320 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'center', md: 'flex-start' },
                gap: 1,
                color: 'primary.main',
              }}
            >
              <Scissors size={18} aria-hidden="true" />
              <Typography
                className="font-display"
                sx={{ fontSize: 24, lineHeight: 1, letterSpacing: '0.04em', color: '#F3ECDF' }}
              >
                Smart Queue
              </Typography>
            </Box>
            <Typography sx={{ mt: 1, fontSize: 13, lineHeight: 1.6, color: '#C9BCA8' }}>
              Smart queue management for modern barbershops — no more crowded
              waiting rooms.
            </Typography>
          </Box>

          {/* Contact handles */}
          <Box>
            <Typography
              className="font-signage"
              sx={{
                mb: 1.25,
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.22em',
                color: 'text.secondary',
              }}
            >
              Get in touch
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                alignItems: { xs: 'center', md: 'flex-end' },
              }}
            >
              {CONTACTS.map((c) => (
                <ContactChip key={c.href} {...c} />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Divider + copyright */}
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: '1px solid rgba(243,236,223,0.1)',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            fontSize: 12,
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          <span>© {year} Smart Queue. All rights reserved.</span>
          <span>Crafted for modern barbershops.</span>
        </Box>
      </Box>

      {/* End-of-page barber pole — mirrors the stripe at the top of the app. */}
      <BarberPole className="h-2.5 w-full" />
    </Box>
  );
}
