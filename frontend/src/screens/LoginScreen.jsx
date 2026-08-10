import BarberLoginScreen from '../components/BarberLoginScreen';
import BarberPole from '../components/BarberPole';
import PageTransition from '../components/PageTransition';

// Route-level login screen. On desktop a stripe runs along the very top of the
// screen, above the floating ticket-stub card (which has its own top-edge
// stripe). On mobile the card is full-bleed and its own stripe already sits at
// the top, so this route-level one is hidden to avoid a doubled pole.
export default function LoginScreen() {
  return (
    <PageTransition className="flex flex-1 flex-col">
      <BarberPole className="hidden h-2.5 w-full sm:block" />
      <div className="flex flex-1 flex-col">
        <BarberLoginScreen />
      </div>
    </PageTransition>
  );
}
