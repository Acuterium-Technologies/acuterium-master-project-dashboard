import { readMatrix, readTasks, readMilestones, readKpis } from '@/lib/sheets';
import { Dashboard } from '@/components/Dashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  const [matrix, tasks, milestones, kpis] = await Promise.all([
    readMatrix(), readTasks(), readMilestones(), readKpis()
  ]);

  return <Dashboard initialMatrix={matrix} initialTasks={tasks} initialMilestones={milestones} initialKpis={kpis} />;
}
