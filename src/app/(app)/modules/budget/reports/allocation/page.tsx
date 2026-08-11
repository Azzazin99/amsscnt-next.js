import React from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetWorkgroupFilter } from "@/components/budget/budget-workgroup-filter";
import { BudgetYearFilter } from "@/components/budget/budget-year-filter";
import { formatMoney } from "@/lib/budget/constants";
import { getActiveBudgetYear, listBudgetYears } from "@/lib/budget/queries";
import {
  listSystemWorkgroups,
  reportAllocationByProject,
} from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = {
  searchParams: Promise<{ year?: string; workgroup?: string }>;
};

export default async function BudgetReportAllocationPage({
  searchParams,
}: Props) {
  await requireBudgetAccess();

  const params = await searchParams;
  const activeYear = await getActiveBudgetYear();
  const allYears = await listBudgetYears();
  const workgroups = await listSystemWorkgroups();

  if (!activeYear && allYears.length === 0) return <BudgetNoActiveYear />;

  const yearList = allYears.map((y) => y.budgetYear);
  const selectedYear = params.year
    ? Number(params.year)
    : (activeYear?.budgetYear ?? yearList[0]);

  const selectedWorkgroup = params.workgroup
    ? Number(params.workgroup)
    : undefined;

  const { projects, totalBudget } = await reportAllocationByProject(
    selectedYear,
    selectedWorkgroup,
  );

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden space-y-0">
      {/* Integrated Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b bg-muted/20">
        <div>
          <h2 className="text-base font-semibold text-teal-800 dark:text-teal-400 tracking-tight">
            รายงานการจัดสรรงบประมาณจำแนกตามโครงการ ปีงบประมาณ {selectedYear}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BudgetWorkgroupFilter
            workgroups={workgroups}
            selectedWorkgroup={selectedWorkgroup}
          />
          <BudgetYearFilter years={yearList} selectedYear={selectedYear} />
        </div>
      </div>

      {/* Main Hierarchical Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm border-collapse border border-border/60">
          <thead>
            <tr className="bg-rose-200/80 dark:bg-rose-950/60 text-foreground font-semibold divide-x divide-border/60 border-b border-border/60">
              <th className="px-3 py-3 text-center w-12">ที่</th>
              <th className="px-3 py-3 text-center w-16">รหัส</th>
              <th className="px-3 py-3 text-left w-56">โครงการ</th>
              <th className="px-3 py-3 text-left">กิจกรรม</th>
              <th className="px-3 py-3 text-right w-36">งบประมาณ</th>
              <th className="px-3 py-3 text-left w-44">แหล่งงบประมาณ</th>
              <th className="px-3 py-3 text-left w-44">ผู้รับผิดชอบ</th>
              <th className="px-3 py-3 text-center w-14">ไฟล์</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {projects.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลโครงการในปีงบประมาณ {selectedYear}
                </td>
              </tr>
            ) : (
              projects.map((proj, idx) => (
                <React.Fragment key={proj.id}>
                  {/* Project Parent Row */}
                  <tr className="bg-amber-100/80 dark:bg-amber-950/40 font-semibold divide-x divide-border/40">
                    <td className="px-3 py-2.5 text-center text-foreground font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2.5 text-center text-foreground font-mono">
                      {proj.codeProj}
                    </td>
                    <td
                      colSpan={2}
                      className="px-3 py-2.5 text-foreground font-medium"
                    >
                      {proj.nameProj}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-rose-600 dark:text-rose-400 font-bold">
                      {formatMoney(proj.budgetProj)}
                    </td>
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5 text-foreground font-normal">
                      {proj.ownerProjName}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {proj.fileDetail ? (
                        <Link
                          href={proj.fileDetail}
                          target="_blank"
                          className="inline-flex items-center justify-center p-1 rounded hover:bg-muted text-primary"
                          title="อ่านโครงการ"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
                      ) : null}
                    </td>
                  </tr>

                  {/* Activity Child Rows */}
                  {proj.activities.map((acti) => {
                    const isStopped = acti.stop === 1;
                    return (
                      <tr
                        key={acti.id}
                        className="bg-card hover:bg-accent/40 transition-colors divide-x divide-border/30"
                      >
                        <td className="px-3 py-2 text-center" />
                        <td className="px-3 py-2 text-center" />
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2 text-foreground">
                          {isStopped ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              ***{" "}
                              <span className="font-mono font-bold mr-1.5">
                                {acti.codeActi}
                              </span>
                              &nbsp;{acti.nameActi}
                            </span>
                          ) : (
                            <span>
                              <span className="text-blue-600 dark:text-blue-400 font-mono font-bold mr-1.5">
                                {acti.codeActi}
                              </span>
                              &nbsp;{acti.nameActi}
                            </span>
                          )}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-mono font-bold ${
                            isStopped
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          }`}
                        >
                          {formatMoney(acti.budgetActi)}
                        </td>
                        <td className="px-3 py-2 text-foreground/90 text-xs sm:text-sm font-normal">
                          {acti.codeApproveText}
                        </td>
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2" />
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </tbody>
          {projects.length > 0 ? (
            <tfoot>
              <tr className="border-t-2 border-border/80 bg-rose-200/80 dark:bg-rose-950/60 font-bold text-foreground divide-x divide-border/60">
                <td colSpan={3} />
                <td className="px-3 py-3 text-center">รวม</td>
                <td className="px-3 py-3 text-right font-mono text-rose-700 dark:text-rose-300">
                  {formatMoney(totalBudget)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {/* Footnote Note */}
      <div className="p-4 border-t bg-muted/10 text-xs sm:text-sm text-foreground font-medium">
        <span>หมายเหตุ กิจกรรมที่มีเครื่องหมาย *** และ </span>
        <span className="text-emerald-600 dark:text-emerald-400 font-bold mx-1">
          ตัวเลขสีเขียว
        </span>
        <span>หมายถึง กิจกรรมนี้สิ้นสุดการดำเนินการ</span>
      </div>
    </section>
  );
}
