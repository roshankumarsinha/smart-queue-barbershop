import DashboardShell from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import QueueBoard from '../components/QueueBoard';

export default function StaffDashboard() {
  return (
    <PageTransition>
      <DashboardShell roleKey="BARBER_STAFF">
        {/* Barbers get Next / Walk-in / Skip — but not no-show. */}
        <QueueBoard />
      </DashboardShell>
    </PageTransition>
  );
}
