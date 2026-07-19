import { createTheme } from '@mui/material/styles';

// MUI theme wired to the Smart Queue design tokens (mirrors tailwind.config.js).
// This lets MUI components (TextField, Button, Tabs, Card, ...) inherit the
// brass/ivory/oxblood palette automatically, while Tailwind still handles
// layout + the bespoke ticket-stub / barber-pole visuals.
const sans =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';

export const theme = createTheme({
  palette: {
    mode: 'light', // MUI components mostly sit on the ivory card surfaces
    primary: { main: '#C89B3C', dark: '#A67C2E', contrastText: '#241A14' }, // brass
    secondary: { main: '#7B2D2D', contrastText: '#F3ECDF' }, // oxblood
    error: { main: '#B23A32' },
    success: { main: '#3F7A57' },
    background: { default: '#1B1512', paper: '#F3ECDF' }, // charcoal / ivory
    text: { primary: '#241A14', secondary: '#6B5D4F' }, // ink / ink-muted
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: sans,
    button: { textTransform: 'none', fontWeight: 600 },
  },
});

export default theme;
