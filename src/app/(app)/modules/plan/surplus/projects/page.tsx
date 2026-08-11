import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { PlanListFilters } from "@/components/plan/plan-list-filters";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/budget/constants";
import { PLAN_PROJECT_KIND } from "@/lib/db/schema";
import {
  PAGE_SIZE,
  countPlanProjects,
  getActivePlanYear,
  listPlanProjectsPage,
  parsePlanListParams,
  resolvePlanListPage,
} from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

const BASE_PATH = "/modules/plan/surplus/projects";

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function SurplusProjectsPage({ searchParams }: Props) {
  await requirePlanAccess();
  const activeYear = await getActivePlanYear();
  const params = await searchParams;
  const parsed = parsePlanListParams(params);

  if (!activeYear) {
    return (
      <section className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>ยังไม่ได้กำหนดปีงบประมาณ — ไปที่เมนูปีงบประมาณเพื่อตั้งค่าก่อน</p>
        <Link href="/modules/plan/years" className="mt-4 inline-block text-primary hover:underline">
          กำหนดปีงบประมาณ
        </Link>
      </section>
    );
  }

  const total = await countPlanProjects(
    activeYear.budgetYear,
    parsed.q,
    PLAN_PROJECT_KIND.surplus,
  );
  const page = await resolvePlanListPage(total, parsed.page);
  const rows = await listPlanProjectsPage({
    budgetYear: activeYear.budgetYear,
    page,
    q: parsed.q,
    projectKind: PLAN_PROJECT_KIND.surplus,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function hrefForPage(p: number) {
    const sp = new URLSearchParams();
    if (p > 1) sp.set("page", String(p));
    if (parsed.q) sp.set("q", parsed.q);
    const qs = sp.toString();
    return qs ? `${BASE_PATH}?${qs}` : BASE_PATH;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            โครงการเงินเหลือจ่าย {activeYear.budgetYear}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString("th-TH")} โครงการ
          </p>
        </div>
        <Link href={`${BASE_PATH}/new`} className={cn(buttonVariants(), "min-h-11")}>
          เพิ่มโครงการ
        </Link>
      </div>

      <PlanListFilters q={parsed.q} basePath={BASE_PATH} />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">รหัส</th>
              <th className="px-3 py-3 font-medium">ชื่อโครงการ</th>
              <th className="px-3 py-3 font-medium">กลุ่มงาน</th>
              <th className="px-3 py-3 font-medium">หัวหน้าโครงการ</th>
              <th className="px-3 py-3 text-right font-medium">งบจัดสรร</th>
              <th className="px-3 py-3 font-medium">ระยะเวลา</th>
              <th className="px-3 py-3 text-center font-medium">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  ไม่พบโครงการ
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5 font-mono">{row.codeProj}</td>
                  <td className="px-3 py-2.5">{row.nameProj}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {row.workgroupName ?? row.codeClus}
                  </td>
                  <td className="px-3 py-2.5">{row.ownerName ?? row.ownerProj ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right">{formatMoney(row.budgetProj)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                    {formatThaiDate(row.beginDate)} – {formatThaiDate(row.finishDate)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link href={`${BASE_PATH}/${row.id}`} className="text-primary hover:underline">
                      ดู
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ListPagination page={page} totalPages={totalPages} hrefForPage={hrefForPage} />
    </section>
  );
}
