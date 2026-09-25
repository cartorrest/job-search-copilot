import Dashboard from '@/components/Dashboard';

// Server component: reads DEMO_MODE on the server so a single env var
// switches the whole app between the public demo and the private,
// Sheet-backed dashboard.
export const dynamic = 'force-dynamic';

export default function Page() {
  return <Dashboard demo={process.env.DEMO_MODE === 'true'} />;
}
