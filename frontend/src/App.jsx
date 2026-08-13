import { Provider, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import { theme } from './theme';
import { store } from './store/store';
import { selectIsAuthenticated, selectRole } from './store/authSlice';
import { getRole } from './config/roles';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import LoginScreen from './screens/LoginScreen';
import OwnerDashboard from './screens/OwnerDashboard';
import StaffDashboard from './screens/StaffDashboard';
import AdminDashboard from './screens/AdminDashboard';
import OwnerShops from './screens/OwnerShops';
import ShopServices from './screens/ShopServices';

// Single react-query client for the whole app. Real API calls will hang off
// this once a backend exists (see src/api/client.js).
const queryClient = new QueryClient();

// Sends "/" to the right place: the user's dashboard if logged in, else login.
function IndexRedirect() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectRole);
  if (isAuthenticated) {
    return <Navigate to={getRole(role)?.path ?? '/login'} replace />;
  }
  return <Navigate to="/login" replace />;
}

// Routes wrapped in AnimatePresence so screens animate in/out (login <-> dash).
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<IndexRedirect />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route
          path="/owner"
          element={
            <ProtectedRoute allow="SHOP_OWNER">
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute allow="BARBER_STAFF">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allow="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/owners/:ownerId"
          element={
            <ProtectedRoute allow="ADMIN">
              <OwnerShops />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/shops/:shopId"
          element={
            <ProtectedRoute allow="ADMIN">
              <ShopServices />
            </ProtectedRoute>
          }
        />
        {/* Unknown path -> let the index logic decide where to send them. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    // injectFirst puts MUI/emotion styles ahead of Tailwind so Tailwind
    // utility classes can still override MUI component styles when needed.
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            {/* Fixed film-grain texture over the ambient backdrop. */}
            <div className="grain-overlay" aria-hidden="true" />
            <BrowserRouter>
              {/* Sticky-footer column: routes grow to fill, footer pins to the
                  bottom on every page. */}
              <div className="relative z-10 flex min-h-screen flex-col">
                <div className="flex flex-1 flex-col">
                  <AnimatedRoutes />
                </div>
                <Footer />
              </div>
            </BrowserRouter>
          </QueryClientProvider>
        </Provider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
