import { BudgetMainKindList } from "@/components/budget/budget-main-kind-list";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canReceiveBudgetByKind } from "@/lib/budget/permissions";
import {
  PAGE_SIZE,
  countBudgetMain,
  getActiveBudgetYear,
  listBudgetMainPage,
  parseBudgetListParams,
  resolveBudgetListPage,
  sumBudgetMain,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { deleteBudgetKindReceive } from "@/lib/budget/workflow-actions";

type Props = { searchParams: Promise<{ page?: string; q?: string }> };

export default async function BudgetReceiveBudgetPage({ searchParams }: Props) {
  const { user, perms } = await requireBudgetAccess();
  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const params = await searchParams;
  const parsed = parseBudgetListParams(params);
  const total = await countBudgetMain(activeYear.budgetYear, parsed.q, "receive");
  const totalSum = await sumBudgetMain(activeYear.budgetYear, parsed.q, "receive");
  const page = await resolveBudgetListPage(total, parsed.page);
  const rows = await listBudgetMainPage({
    budgetYear: activeYear.budgetYear,
    page,
    q: parsed.q,
    kind: "receive",
  });

  async function handleDelete(id: number) {
    "use server";
    await deleteBudgetKindReceive("budget", id);
  }

  return (
    <BudgetMainKindList
      title={`ทะเบียนรับเงินงบประมาณ ปีงบประมาณ ${activeYear.budgetYear}`}
      basePath="/modules/budget/receive/budget"
      mode="receive"
      newLabel="เพิ่มรายการรับ"
      rows={rows}
      total={total}
      totalSum={totalSum}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      q={parsed.q}
      canWrite={canReceiveBudgetByKind(user, perms, "budget")}
      deleteAction={handleDelete}
    />
  );
}
