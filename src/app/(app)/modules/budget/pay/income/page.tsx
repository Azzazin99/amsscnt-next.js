import { BudgetMainKindList } from "@/components/budget/budget-main-kind-list";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { canWriteBudgetPay } from "@/lib/budget/permissions";
import {
  PAGE_SIZE,
  countBudgetMainByKind,
  getActiveBudgetYear,
  listBudgetMainByKind,
  parseBudgetListParams,
  resolveBudgetListPage,
} from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = { searchParams: Promise<{ page?: string; q?: string }> };

export default async function BudgetPayIncomePage({ searchParams }: Props) {
  const { user, perms } = await requireBudgetAccess();
  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  const params = await searchParams;
  const parsed = parseBudgetListParams(params);
  const total = await countBudgetMainByKind({
    budgetYear: activeYear.budgetYear,
    kind: "income",
    mode: "pay",
    q: parsed.q,
  });
  const page = await resolveBudgetListPage(total, parsed.page);
  const rows = await listBudgetMainByKind({
    budgetYear: activeYear.budgetYear,
    kind: "income",
    mode: "pay",
    page,
    q: parsed.q,
  });

  return (
    <BudgetMainKindList
      title={`ทะเบียนจ่ายเงินรายได้แผ่นดิน ${activeYear.budgetYear}`}
      basePath="/modules/budget/pay/income"
      mode="pay"
      rows={rows}
      total={total}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      q={parsed.q}
      canWrite={canWriteBudgetPay(user, perms, "income")}
      newLabel="เพิ่มรายการจ่าย"
    />
  );
}
