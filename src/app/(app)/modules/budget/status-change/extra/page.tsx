import { BudgetMainKindList } from "@/components/budget/budget-main-kind-list";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canChangeBudgetStatus } from "@/lib/budget/permissions";
import {
  PAGE_SIZE,
  countBudgetMainByKind,
  getActiveBudgetYear,
  listBudgetMainByKind,
  parseBudgetListParams,
  resolveBudgetListPage,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { deleteBudgetStatusChange } from "@/lib/budget/workflow-actions";

type Props = { searchParams: Promise<{ page?: string; q?: string }> };

export default async function BudgetStatusChangeExtraPage({ searchParams }: Props) {
  const { user, perms } = await requireBudgetAccess();
  const canWrite = canChangeBudgetStatus(user, perms, "extra");

  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const params = await searchParams;
  const parsed = parseBudgetListParams(params);
  const total = await countBudgetMainByKind({
    budgetYear: activeYear.budgetYear,
    kind: "extra",
    mode: "change",
    q: parsed.q,
  });
  const page = await resolveBudgetListPage(total, parsed.page);
  const rows = await listBudgetMainByKind({
    budgetYear: activeYear.budgetYear,
    kind: "extra",
    mode: "change",
    page,
    q: parsed.q,
  });

  return (
    <BudgetMainKindList
      title={`ปรับปรุงเงินนอกงบประมาณ ${activeYear.budgetYear}`}
      basePath="/modules/budget/status-change/extra"
      mode="change"
      rows={rows}
      total={total}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      q={parsed.q}
      canWrite={canWrite}
      newLabel="เพิ่มรายการ"
      showDetailLink={false}
      deleteAction={
        canWrite ? deleteBudgetStatusChange.bind(null, "extra") : undefined
      }
    />
  );
}
