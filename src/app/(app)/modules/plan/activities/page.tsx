import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { PlanListFilters } from "@/components/plan/plan-list-filters";
import { formatMoney } from "@/lib/budget/constants";
import { buildPlanActivitiesUrl } from "@/lib/plan/list-url";
import {
  PAGE_SIZE,
  countPlanActivities,
  getActivePlanYear,
  listPlanActivitiesPage,
  listProjectOptions,
  parsePlanListParams,
  resolvePlanListPage,
} from "@/lib/plan/queries";
import { requirePlanAccess } from "@/lib/plan/scope";
import { formatThaiDate } from "@/lib/format/thai-date";

type Props = {
  searchParams: Promise<{ page?: string; q?: string; proj?: string }>;
};

export default async function PlanActivitiesPage({ searchParams }: Props) {
  await requirePlanAccess();
  const activeYear = await getActivePlanYear();
  const params = await searchParams;
  const parsed = parsePlanListParams(params);

  if (!activeYear) {
    return (
      <section className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p>ยังไม่ได้กำหนดปีงบประมาณ</p>
        <Link href="/modules/plan/years" className="mt-4 inline-block text-primary hover:underline">
          กำหนดปีงบประมาณ
        </Link>
      </section>
    );
  }

  const projectOptions = await listProjectOptions(activeYear.budgetYear);
  const total = await countPlanActivities(
    activeYear.budgetYear,
    parsed.q,
    parsed.codeProj,
  );
  const page = await resolvePlanListPage(total, parsed.page);
  const rows = await listPlanActivitiesPage({
    budgetYear: activeYear.budgetYear,
    page,
    q: parsed.q,
    codeProj: parsed.codeProj,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          กิจกรรม ปีงบประมาณ {activeYear.budgetYear}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString("th-TH")} กิจกรรม
        </p>
      </div>

      <PlanListFilters
        q={parsed.q}
        proj={parsed.codeProj}
        basePath="/modules/plan/activities"
        showProjectFilter
        projectOptions={projectOptions}
      />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">รหัส</th>
              <th className="px-3 py-3 font-medium">ชื่อกิจกรรม</th>
              <th className="px-3 py-3 font-medium">โครงการ</th>
              <th className="px-3 py-3 text-right font-medium">งบ</th>
              <th className="px-3 py-3 font-medium">ระยะเวลา</th>
              <th className="px-3 py-3 text-center font-medium">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  ไม่พบกิจกรรม
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5 font-mono">{row.codeActi}</td>
                  <td className="px-3 py-2.5">{row.nameActi}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {row.codeProj} {row.projectName ?? ""}
                  </td>
                  <td className="px-3 py-2.5 text-right">{formatMoney(row.budgetActi)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                    {formatThaiDate(row.beginDate)} – {formatThaiDate(row.finishDate)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link href={`/modules/plan/activities/${row.id}`} className="text-primary hover:underline">
                      ดู
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefForPage={(p) =>
          buildPlanActivitiesUrl({ page: p, q: parsed.q, proj: parsed.codeProj })
        }
      />
    </section>
  );
}
