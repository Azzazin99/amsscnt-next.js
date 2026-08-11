import React from "react";
import Link from "next/link";
import { FileSearch } from "lucide-react";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetYearFilter } from "@/components/budget/budget-year-filter";
import { AppPagination } from "@/components/ui/app-pagination";
import { formatMoney } from "@/lib/budget/constants";
import {
  PAGE_SIZE,
  getActiveBudgetYear,
  listBudgetYears,
} from "@/lib/budget/queries";
import {
  getDeegaRecordDetail,
  reportBudgetCodeDeegaDetail,
  reportSpendingByBudgetCodeList,
} from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = {
  searchParams: Promise<{
    year?: string;
    code?: string;
    project?: string;
    pay_group?: string;
    deega_id?: string;
    page?: string;
  }>;
};

export default async function BudgetReportByBudgetCodePage({
  searchParams,
}: Props) {
  await requireBudgetAccess();

  const params = await searchParams;
  const activeYear = await getActiveBudgetYear();
  const allYears = await listBudgetYears();

  if (!activeYear && allYears.length === 0) return <BudgetNoActiveYear />;

  const yearList = allYears.map((y) => y.budgetYear);
  const selectedYear = params.year
    ? Number(params.year)
    : (activeYear?.budgetYear ?? yearList[0]);

  const targetCode = params.code || params.project;
  const page = params.page ? Math.max(1, Number(params.page)) : 1;

  // Check 1: Viewing single deega record form detail (from clicking icon in deega detail table)
  if (params.deega_id) {
    const recId = Number(params.deega_id);
    const detail = await getDeegaRecordDetail(recId);

    if (detail) {
      const backUrl = targetCode
        ? `/modules/budget/reports/by-budget-code?code=${targetCode}&page=${page}`
        : `/modules/budget/reports/by-budget-code`;

      return (
        <section className="rounded-xl border bg-card shadow-sm overflow-hidden p-6 space-y-6 max-w-4xl mx-auto">
          {/* Title Header */}
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-bold text-teal-800 dark:text-teal-400">
              รายละเอียดฎีกา
            </h2>
          </div>

          {/* Back Button Top Right */}
          <div className="flex justify-end">
            <Link
              href={backUrl}
              className="px-3 py-1.5 rounded-md bg-muted hover:bg-accent text-foreground text-xs sm:text-sm font-medium border border-border shadow-2xs transition-colors"
            >
              &lt;&lt;กลับหน้าก่อน
            </Link>
          </div>

          {/* Readonly Deega Form Detail matching screenshot */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-6 space-y-4 text-xs sm:text-sm">
            {/* วดป ลงทะเบียน */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                วดป ลงทะเบียน
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={detail.dateRegShort}
                  readOnly
                  className="w-48 h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* เลขที่ฎีกา */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                เลขที่ฎีกา
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={detail.deegaNum}
                  readOnly
                  className="w-32 h-9 px-3 rounded-md border border-input bg-background font-mono font-medium text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* ที่เอกสาร */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                ที่เอกสาร
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={detail.doc}
                  readOnly
                  className="w-64 h-9 px-3 rounded-md border border-input bg-background font-mono font-medium text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* เลขที่ใบงวด */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                เลขที่ใบงวด
              </label>
              <div className="sm:col-span-3">
                <select
                  disabled
                  className="w-full sm:w-[420px] h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none cursor-not-allowed"
                >
                  <option>{detail.receiveNumLabel}</option>
                </select>
              </div>
            </div>

            {/* แผน */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                แผน
              </label>
              <div className="sm:col-span-3">
                <select
                  disabled
                  className="w-full sm:w-[420px] h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none cursor-not-allowed"
                >
                  <option>{detail.planName}</option>
                </select>
              </div>
            </div>

            {/* ผลผลิต/โครงการ */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                ผลผลิต/โครงการ
              </label>
              <div className="sm:col-span-3">
                <select
                  disabled
                  className="w-full sm:w-[420px] h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none cursor-not-allowed"
                >
                  <option>{detail.projectName}</option>
                </select>
              </div>
            </div>

            {/* กิจกรรมหลัก */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                กิจกรรมหลัก
              </label>
              <div className="sm:col-span-3">
                <select
                  disabled
                  className="w-full sm:w-[420px] h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none cursor-not-allowed"
                >
                  <option>{detail.activityName}</option>
                </select>
              </div>
            </div>

            {/* งบรายจ่าย */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                งบรายจ่าย
              </label>
              <div className="sm:col-span-3">
                <select
                  disabled
                  className="w-64 h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none cursor-not-allowed"
                >
                  <option>{detail.payTypeName}</option>
                </select>
              </div>
            </div>

            {/* รายการ */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                รายการ
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={detail.item}
                  readOnly
                  className="w-full sm:w-[480px] h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* จำนวนเงินขอเบิก */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                จำนวนเงินขอเบิก
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={detail.withdraw}
                  readOnly
                  className="w-48 h-9 px-3 rounded-md border border-input bg-background font-mono font-medium text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* ภาษี */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                ภาษี
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={detail.tax}
                  readOnly
                  className="w-48 h-9 px-3 rounded-md border border-input bg-background font-mono font-medium text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* รับจริง */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                รับจริง
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={detail.pay}
                  readOnly
                  className="w-48 h-9 px-3 rounded-md border border-input bg-background font-mono font-medium text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* เจ้าหน้าที่ */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                เจ้าหน้าที่
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={detail.officerFullName}
                  readOnly
                  className="w-72 h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>
      );
    }
  }

  // Check 2: Viewing detail list of deega withdraws for a budget code
  if (targetCode) {
    const detail = await reportBudgetCodeDeegaDetail({
      budgetYear: selectedYear,
      project: targetCode,
      payGroup: params.pay_group,
      page,
      pageSize: PAGE_SIZE,
    });

    const totalPages = Math.max(1, Math.ceil(detail.total / PAGE_SIZE));

    return (
      <section className="rounded-xl border bg-card shadow-sm overflow-hidden p-6 space-y-6">
        {/* Centered Header Title */}
        <div className="text-center space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-teal-800 dark:text-teal-400">
            รายการฎีกาเบิกตามรหัสงบประมาณจำแนกตามงบรายจ่าย
          </h2>
          <p className="text-sm font-semibold text-teal-700 dark:text-teal-500 font-mono">
            รหัสงบประมาณ {detail.projectCode}
            {detail.payGroup
              ? ` (${detail.payGroup} ${detail.payTypeName || ""})`
              : ""}
          </p>
        </div>

        {/* Back Button Top Right */}
        <div className="flex justify-end">
          <Link
            href="/modules/budget/reports/by-budget-code"
            className="px-3 py-1.5 rounded-md bg-muted hover:bg-accent text-foreground text-xs sm:text-sm font-medium border border-border shadow-2xs transition-colors"
          >
            &lt;&lt;กลับหน้าก่อน
          </Link>
        </div>

        {/* Top Standard Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-1">
            <AppPagination currentPage={page} totalPages={totalPages} />
          </div>
        )}

        {/* Main Deega Detail Table matching screenshot */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-xs sm:text-sm border-collapse border border-border/60">
            <thead>
              <tr className="bg-rose-200/80 dark:bg-rose-950/60 text-foreground font-semibold divide-x divide-border/60 border-b border-border/60">
                <th className="px-2 py-2.5 text-center w-10">ที่</th>
                <th className="px-3 py-2.5 text-center w-24">ว/ด/ป</th>
                <th className="px-3 py-2.5 text-center w-24">เลขที่ฎีกา</th>
                <th className="px-3 py-2.5 text-left w-32">เลขที่เอกสาร</th>
                <th className="px-3 py-2.5 text-left">รายการ</th>
                <th className="px-3 py-2.5 text-right w-32">ขอเบิก</th>
                <th className="px-3 py-2.5 text-right w-24">ภาษี</th>
                <th className="px-3 py-2.5 text-right w-32">รับจริง</th>
                <th className="px-2 py-2.5 text-center w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {detail.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    ไม่พบรายการฎีกาเบิกสำหรับรหัสงบประมาณนี้
                  </td>
                </tr>
              ) : (
                detail.rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className="even:bg-amber-50/80 dark:even:bg-amber-950/20 odd:bg-card hover:bg-accent/40 transition-colors divide-x divide-border/30"
                  >
                    <td className="px-2 py-2 text-center text-foreground font-medium">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-3 py-2 text-center text-foreground font-medium">
                      {row.dateShort}
                    </td>
                    <td className="px-3 py-2 text-center font-mono font-medium text-foreground">
                      {row.deegaNum}
                    </td>
                    <td className="px-3 py-2 text-left font-mono font-medium text-foreground">
                      {row.doc}
                    </td>
                    <td className="px-3 py-2 text-left text-foreground">
                      {row.item}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-foreground">
                      {formatMoney(row.withdraw)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-foreground">
                      {formatMoney(row.tax)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-medium text-foreground">
                      {formatMoney(row.pay)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Link
                        href={`/modules/budget/reports/by-budget-code?code=${targetCode}&deega_id=${row.id}&page=${page}`}
                        className="inline-flex items-center justify-center p-1 rounded hover:bg-muted text-primary"
                        title="ดูรายละเอียดฎีกา"
                      >
                        <FileSearch className="w-4 h-4 inline" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {detail.rows.length > 0 ? (
              <tfoot>
                <tr className="border-t-2 border-border/80 bg-rose-200/80 dark:bg-rose-950/60 font-bold text-foreground divide-x divide-border/60">
                  <td colSpan={5} className="px-3 py-2.5 text-center">
                    รวม
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {formatMoney(detail.totalWithdraw)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {formatMoney(detail.totalTax)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {formatMoney(detail.totalPay)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>

        {/* Bottom Standard Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-2">
            <AppPagination currentPage={page} totalPages={totalPages} />
          </div>
        )}
      </section>
    );
  }

  // Check 3: Main table view
  const report = await reportSpendingByBudgetCodeList(selectedYear);

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden p-6 space-y-8">
      {/* Centered Document Title */}
      <div className="text-center space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-teal-800 dark:text-teal-400">
          รายงานการใช้จ่ายงบประมาณจำแนกตามรหัสงบประมาณ
        </h2>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <BudgetYearFilter years={yearList} selectedYear={selectedYear} />
        </div>
      </div>

      {/* Main Table View (Table 1) */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-xs sm:text-sm border-collapse border border-border/60">
          <thead>
            <tr className="bg-rose-200/80 dark:bg-rose-950/60 text-foreground font-semibold divide-x divide-border/60 border-b border-border/60">
              <th className="px-2 py-2.5 text-center w-10">ที่</th>
              <th className="px-3 py-2.5 text-left w-56">รหัสงบประมาณ</th>
              <th className="px-3 py-2.5 text-left">งบรายจ่าย</th>
              <th className="px-3 py-2.5 text-right w-36">เงินตามใบงวด</th>
              <th className="px-3 py-2.5 text-right w-36">ฎีกาเบิก</th>
              <th className="px-3 py-2.5 text-right w-32">คืนคลัง</th>
              <th className="px-3 py-2.5 text-right w-36">คงเหลือ</th>
              <th className="px-2 py-2.5 text-right w-20">%จ่าย</th>
              <th className="px-2 py-2.5 text-center w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {report.items.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลรหัสงบประมาณในปีงบประมาณ {selectedYear}
                </td>
              </tr>
            ) : (
              report.items.map((item, idx) => (
                <React.Fragment key={item.code}>
                  {/* Parent Row by Budget Code */}
                  <tr className="bg-amber-100/80 dark:bg-amber-950/40 font-medium divide-x divide-border/40">
                    <td className="px-2 py-2 text-center text-foreground font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 text-left font-mono font-medium text-foreground">
                      {item.code}
                    </td>
                    <td className="px-3 py-2 text-left" />
                    <td className="px-3 py-2 text-right font-mono font-medium text-foreground">
                      {formatMoney(item.receiveMoney)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-medium text-foreground">
                      {formatMoney(item.totalSpent)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-medium text-foreground">
                      {formatMoney(item.totalReturn)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-medium text-foreground">
                      {formatMoney(item.remaining)}
                    </td>
                    <td className="px-2 py-2 text-right font-mono font-medium text-foreground">
                      {item.receiveMoney > 0
                        ? item.percentSpent.toFixed(2)
                        : ""}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {item.totalSpent > 0 ? (
                        <Link
                          href={`/modules/budget/reports/by-budget-code?code=${item.code}`}
                          className="inline-flex items-center justify-center p-1 rounded hover:bg-muted text-primary"
                          title="ดูรายละเอียดการใช้จ่าย"
                        >
                          <FileSearch className="w-3.5 h-3.5" />
                        </Link>
                      ) : null}
                    </td>
                  </tr>

                  {/* Child Rows for Pay Type Groups */}
                  {item.payTypeGroups.map((group) => (
                    <tr
                      key={`${item.code}-${group.payGroup}`}
                      className="bg-card hover:bg-accent/40 transition-colors divide-x divide-border/30 text-xs sm:text-sm"
                    >
                      <td className="px-2 py-1.5 text-center" />
                      <td className="px-3 py-1.5" />
                      <td className="px-3 py-1.5 text-foreground font-normal">
                        <span className="font-mono font-bold mr-1">
                          {group.payGroup}
                        </span>
                        {group.payTypeName}
                      </td>
                      <td className="px-3 py-1.5 text-right" />
                      <td className="px-3 py-1.5 text-right font-mono font-medium text-amber-900 dark:text-amber-400">
                        {formatMoney(group.spent)}
                      </td>
                      <td className="px-3 py-1.5 text-right" />
                      <td className="px-3 py-1.5 text-right" />
                      <td className="px-2 py-1.5 text-right" />
                      <td className="px-2 py-1.5 text-center">
                        <Link
                          href={`/modules/budget/reports/by-budget-code?code=${item.code}&pay_group=${group.payGroup}`}
                          className="inline-flex items-center justify-center p-1 rounded hover:bg-muted text-primary"
                          title="ดูรายละเอียดงบรายจ่าย"
                        >
                          <FileSearch className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
          {report.items.length > 0 ? (
            <tfoot>
              <tr className="border-t-2 border-border/80 bg-rose-200/80 dark:bg-rose-950/60 font-bold text-foreground divide-x divide-border/60">
                <td colSpan={2} className="px-3 py-2.5 text-center">
                  รวม
                </td>
                <td />
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatMoney(report.totalReceive)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatMoney(report.totalSpent)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatMoney(report.totalReturn)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {/* Summary Table by Pay Type (Table 2 at bottom) */}
      {report.payTypeSummaries.length > 0 ? (
        <div className="pt-4 max-w-3xl mx-auto space-y-2">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse border border-border/60">
              <thead>
                <tr className="bg-rose-200/80 dark:bg-rose-950/60 text-foreground font-semibold divide-x divide-border/60 border-b border-border/60">
                  <th className="px-3 py-2 text-center w-12">ที่</th>
                  <th className="px-3 py-2 text-left w-20">รหัส</th>
                  <th className="px-3 py-2 text-left">งบรายจ่าย</th>
                  <th className="px-3 py-2 text-right w-44">ฎีกาเบิก</th>
                  <th className="px-3 py-2 text-right w-40">คืนคลัง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {report.payTypeSummaries.map((s) => (
                  <tr
                    key={s.id}
                    className="even:bg-amber-50/80 dark:even:bg-amber-950/20 odd:bg-card hover:bg-accent/40 transition-colors divide-x divide-border/30"
                  >
                    <td className="px-3 py-1.5 text-center font-medium text-foreground">
                      {s.id}
                    </td>
                    <td className="px-3 py-1.5 text-left font-mono font-medium text-foreground">
                      {s.payGroup}
                    </td>
                    <td className="px-3 py-1.5 text-left text-foreground font-medium">
                      {s.payTypeName}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono font-medium text-foreground">
                      {formatMoney(s.spent)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono font-medium text-foreground">
                      {formatMoney(s.returnMoney)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
