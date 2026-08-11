import { BudgetReceiveList } from "@/components/budget/budget-receive-list";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canManageBudgetAllocation } from "@/lib/budget/permissions";
import {
  PAGE_SIZE,
  countBudgetReceives,
  getActiveBudgetYear,
  listBudgetReceivesPage,
  parseBudgetListParams,
  resolveBudgetListPage,
  sumBudgetReceives,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = { searchParams: Promise<{ page?: string; q?: string }> };

export default async function BudgetAllocationPage({ searchParams }: Props) {
  const { user, perms } = await requireBudgetAccess();
  const canWrite = canManageBudgetAllocation(user, perms);

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const params = await searchParams;
  const parsed = parseBudgetListParams(params);
  const total = await countBudgetReceives(activeYear.budgetYear, parsed.q);
  const totalSum = await sumBudgetReceives(activeYear.budgetYear, parsed.q);
  const page = await resolveBudgetListPage(total, parsed.page);
  const rows = await listBudgetReceivesPage({
    budgetYear: activeYear.budgetYear,
    page,
    q: parsed.q,
  });

  return (
    <BudgetReceiveList
      title={`ทะเบียนโอนการเปลี่ยนแปลงการจัดสรรงบประมาณ ปีงบประมาณ ${activeYear.budgetYear}`}
      basePath="/modules/budget/allocation"
      rows={rows}
      total={total}
      totalSum={totalSum}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      q={parsed.q}
      canWrite={canWrite}
    />
  );
}
