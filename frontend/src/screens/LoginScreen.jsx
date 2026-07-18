import BarberLoginScreen from '../components/BarberLoginScreen';
import BarberPole from '../components/BarberPole';
import PageTransition from '../components/PageTransition';

// Route-level login screen: the animated barber-pole stripe bar runs along the
// top of the screen, with the ticket-stub login card below it.
export default function LoginScreen() {
  return (
    <PageTransition className="flex min-h-full flex-col">
      <BarberPole className="h-2.5 w-full" />
      <div className="flex flex-1 flex-col">
        <BarberLoginScreen />
      </div>
    </PageTransition>
  );
}
