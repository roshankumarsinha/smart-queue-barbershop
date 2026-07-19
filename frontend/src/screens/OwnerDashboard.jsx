import DashboardShell from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import QueueBoard from '../components/QueueBoard';

export default function OwnerDashboard() {
  return (
    <PageTransition>
      <DashboardShell roleKey="SHOP_OWNER">
        {/* Owners get the full board incl. the no-show action. */}
        <QueueBoard canNoShow />
      </DashboardShell>
    </PageTransition>
  );
}
