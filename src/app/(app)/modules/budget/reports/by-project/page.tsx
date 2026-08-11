import React from "react";
import Link from "next/link";
import { FileSearch } from "lucide-react";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetWorkgroupFilter } from "@/components/budget/budget-workgroup-filter";
import { BudgetYearFilter } from "@/components/budget/budget-year-filter";
import { formatMoney } from "@/lib/budget/constants";
import { getActiveBudgetYear, listBudgetYears } from "@/lib/budget/queries";
import {
  getReturnRecordDetail,
  getWithdrawRecordDetail,
  listSystemWorkgroups,
  reportActivityDetail,
  reportSpendingByProjectList,
} from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = {
  searchParams: Promise<{
    year?: string;
    workgroup?: string;
    pj_activity?: string;
    withdraw_id?: string;
    return_id?: string;
  }>;
};

export default async function BudgetReportByProjectPage({
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

  // Check 1: Viewing single return record form detail (from clicking icon in return table)
  if (params.return_id) {
    const recId = Number(params.return_id);
    const recDetail = await getReturnRecordDetail(recId);

    if (recDetail) {
      const backUrl = params.pj_activity
        ? `/modules/budget/reports/by-project?pj_activity=${params.pj_activity}`
        : `/modules/budget/reports/by-project`;

      return (
        <section className="rounded-xl border bg-card shadow-sm overflow-hidden p-6 space-y-6 max-w-4xl mx-auto">
          {/* Title Header */}
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-bold text-teal-800 dark:text-teal-400">
              ทะเบียนคืนเงินโครงการ ปีงบประมาณ{recDetail.budgetYear}
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

          {/* Form Detail Container matching screenshot */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-6 space-y-4 text-xs sm:text-sm">
            {/* วดป ลงทะเบียน */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                วดป ลงทะเบียน
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={recDetail.dateRegShort}
                  readOnly
                  className="w-48 h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none"
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
                  value={recDetail.document}
                  readOnly
                  className="w-64 h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none"
                />
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
                  value={recDetail.item}
                  readOnly
                  className="w-full h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* โครงการ */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                โครงการ
              </label>
              <div className="sm:col-span-3">
                <select
                  disabled
                  className="w-full h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none cursor-not-allowed"
                >
                  <option>
                    {recDetail.codeProj} {recDetail.nameProj}
                  </option>
                </select>
              </div>
            </div>

            {/* กิจกรรม */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                กิจกรรม
              </label>
              <div className="sm:col-span-3">
                <select
                  disabled
                  className="w-full h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none cursor-not-allowed"
                >
                  <option>
                    {recDetail.codeActi} {recDetail.nameActi}
                  </option>
                </select>
              </div>
            </div>

            {/* จำนวนเงิน */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                จำนวนเงิน
              </label>
              <div className="sm:col-span-3 flex items-center gap-2">
                <input
                  type="text"
                  value={formatMoney(recDetail.money)}
                  readOnly
                  className="w-48 h-9 px-3 rounded-md border border-input bg-background font-mono font-medium text-foreground text-right focus:outline-none"
                />
                <span className="text-foreground font-medium">บาท</span>
              </div>
            </div>

            {/* ประเภทรายการจ่าย */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                ประเภทรายการจ่าย
              </label>
              <div className="sm:col-span-3">
                <select
                  disabled
                  className="w-64 h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none cursor-not-allowed"
                >
                  <option>
                    {recDetail.payTypeName || "งบรายจ่ายอื่น/เบิกแทนกัน"}
                  </option>
                </select>
              </div>
            </div>

            {/* ผู้คืนเงินโครงการ */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                ผู้คืนเงินโครงการ
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={recDetail.pRequest}
                  readOnly
                  className="w-72 h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none"
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
                  value={recDetail.officerFullName}
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

  // Check 2: Viewing single withdraw record form detail (from clicking icon in withdraw table)
  if (params.withdraw_id) {
    const recId = Number(params.withdraw_id);
    const recDetail = await getWithdrawRecordDetail(recId);

    if (recDetail) {
      const backUrl = params.pj_activity
        ? `/modules/budget/reports/by-project?pj_activity=${params.pj_activity}`
        : `/modules/budget/reports/by-project`;

      return (
        <section className="rounded-xl border bg-card shadow-sm overflow-hidden p-6 space-y-6 max-w-4xl mx-auto">
          {/* Title Header */}
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-bold text-teal-800 dark:text-teal-400">
              ทะเบียน ขอเบิก/ขอยืมเงิน ปีงบประมาณ{recDetail.budgetYear}
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

          {/* Form Detail Container matching screenshot */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-6 space-y-4 text-xs sm:text-sm">
            {/* วดป ลงทะเบียน */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                วดป ลงทะเบียน
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={recDetail.dateRegShort}
                  readOnly
                  className="w-48 h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none"
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
                  value={recDetail.document}
                  readOnly
                  className="w-64 h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* ขอยืมเงินงบประมาณ */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                ขอยืมเงินงบประมาณ
              </label>
              <div className="sm:col-span-3 flex items-center gap-3">
                <input
                  type="radio"
                  checked={recDetail.borrowStatus === 1}
                  readOnly
                  className="w-4 h-4 text-primary"
                />
                {recDetail.borrowStatus === 1 && recDetail.borrowedRecDate ? (
                  <span className="text-foreground">
                    ปี(คศ)เดือนวัน{" "}
                    <input
                      type="text"
                      value={recDetail.borrowedRecDate}
                      readOnly
                      className="w-32 h-8 px-2 rounded border border-input bg-background font-mono inline ml-1"
                    />
                  </span>
                ) : null}
              </div>
            </div>

            {/* ขอยืมเงินนอกงบประมาณ */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                ขอยืมเงินนอกงบประมาณ
              </label>
              <div className="sm:col-span-3 flex items-center gap-3">
                <input
                  type="radio"
                  checked={recDetail.borrowStatus === 2}
                  readOnly
                  className="w-4 h-4 text-primary"
                />
                {recDetail.borrowStatus === 2 && recDetail.borrowedRecDate ? (
                  <span className="text-foreground">
                    ปี(คศ)เดือนวัน{" "}
                    <input
                      type="text"
                      value={recDetail.borrowedRecDate}
                      readOnly
                      className="w-32 h-8 px-2 rounded border border-input bg-background font-mono inline ml-1"
                    />
                  </span>
                ) : null}
              </div>
            </div>

            {/* ขอยืมเงินทดรองราชการ */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                ขอยืมเงินทดรองราชการ
              </label>
              <div className="sm:col-span-3 flex items-center gap-3">
                <input
                  type="radio"
                  checked={recDetail.borrowStatus === 3}
                  readOnly
                  className="w-4 h-4 text-primary"
                />
                {recDetail.borrowStatus === 3 && recDetail.borrowedRecDate ? (
                  <span className="text-foreground">
                    ปี(คศ)เดือนวัน{" "}
                    <input
                      type="text"
                      value={recDetail.borrowedRecDate}
                      readOnly
                      className="w-32 h-8 px-2 rounded border border-input bg-background font-mono inline ml-1"
                    />
                  </span>
                ) : null}
              </div>
            </div>

            {/* ขอเบิก */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                ขอเบิก
              </label>
              <div className="sm:col-span-3 flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    checked={recDetail.withdrawStatus === 4}
                    readOnly
                    className="w-4 h-4 text-primary"
                  />
                  <span>ใช่</span>
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    checked={recDetail.withdrawStatus !== 4}
                    readOnly
                    className="w-4 h-4 text-primary"
                  />
                  <span>ไม่ใช่</span>
                </label>

                {recDetail.withdrawRecDate ? (
                  <span className="text-foreground ml-2">
                    ปี(คศ)เดือนวัน{" "}
                    <input
                      type="text"
                      value={recDetail.withdrawRecDate}
                      readOnly
                      className="w-36 h-9 px-3 rounded-md border border-input bg-background font-mono inline ml-1"
                    />
                  </span>
                ) : null}
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
                  value={recDetail.item}
                  readOnly
                  className="w-full h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* โครงการ */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                โครงการ
              </label>
              <div className="sm:col-span-3">
                <select
                  disabled
                  className="w-full h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none cursor-not-allowed"
                >
                  <option>
                    {recDetail.codeProj} {recDetail.nameProj}
                  </option>
                </select>
              </div>
            </div>

            {/* กิจกรรม */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                กิจกรรม
              </label>
              <div className="sm:col-span-3">
                <select
                  disabled
                  className="w-full h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none cursor-not-allowed"
                >
                  <option>
                    {recDetail.codeActi} {recDetail.nameActi}
                  </option>
                </select>
              </div>
            </div>

            {/* จำนวนเงิน */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                จำนวนเงิน
              </label>
              <div className="sm:col-span-3 flex items-center gap-2">
                <input
                  type="text"
                  value={formatMoney(recDetail.money)}
                  readOnly
                  className="w-48 h-9 px-3 rounded-md border border-input bg-background font-mono font-medium text-foreground text-right focus:outline-none"
                />
                <span className="text-foreground font-medium">บาท</span>
              </div>
            </div>

            {/* แหล่งเงิน */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                แหล่งเงิน
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={recDetail.moneySource}
                  readOnly
                  className="w-full h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* ประเภทรายการจ่าย */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                ประเภทรายการจ่าย
              </label>
              <div className="sm:col-span-3">
                <select
                  disabled
                  className="w-64 h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none cursor-not-allowed"
                >
                  <option>
                    {recDetail.payTypeName || "งบรายจ่ายอื่น/เบิกแทนกัน"}
                  </option>
                </select>
              </div>
            </div>

            {/* ผู้ขอเบิก/ขอยืมเงิน */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2">
              <label className="sm:text-right font-medium text-foreground/80">
                ผู้ขอเบิก/ขอยืมเงิน
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={recDetail.pRequest}
                  readOnly
                  className="w-72 h-9 px-3 rounded-md border border-input bg-background font-medium text-foreground focus:outline-none"
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
                  value={recDetail.officerFullName}
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

  // Check 3: Viewing activity detail report (table of withdraw items & return items)
  if (params.pj_activity) {
    const detail = await reportActivityDetail(
      selectedYear,
      params.pj_activity,
    );

    return (
      <section className="rounded-xl border bg-card shadow-sm overflow-hidden p-6 space-y-6">
        {/* Title Header */}
        <div className="text-center space-y-1.5">
          <h2 className="text-lg font-bold text-teal-800 dark:text-teal-400">
            รายการขอเบิก/ขอยืมเงินโครงการ
          </h2>
          <p className="text-sm font-semibold text-teal-700 dark:text-teal-500">
            โครงการ {detail.projectName}
          </p>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-500">
            กิจกรรม {detail.activityName}
          </p>
        </div>

        {/* Back Button Top Right */}
        <div className="flex justify-end">
          <Link
            href="/modules/budget/reports/by-project"
            className="px-3 py-1.5 rounded-md bg-muted hover:bg-accent text-foreground text-xs sm:text-sm font-medium border border-border shadow-2xs transition-colors"
          >
            &lt;&lt;กลับหน้าก่อน
          </Link>
        </div>

        {/* Table 1: รายการขอเบิก/ขอยืมเงินโครงการ */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-xs sm:text-sm border-collapse border border-border/60">
            <thead>
              <tr className="bg-rose-200/80 dark:bg-rose-950/60 text-foreground font-semibold divide-x divide-border/60 border-b border-border/60">
                <th className="px-3 py-2.5 text-center w-12">ที่</th>
                <th className="px-3 py-2.5 text-center w-28">ว/ด/ป</th>
                <th className="px-3 py-2.5 text-left">รายการ</th>
                <th className="px-3 py-2.5 text-right w-44">จำนวนเงิน</th>
                <th className="px-2 py-2.5 text-center w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {detail.withdrawItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    ไม่พบรายการขอเบิก/ขอยืมเงินในกิจกรรมนี้
                  </td>
                </tr>
              ) : (
                detail.withdrawItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="even:bg-amber-50/80 dark:even:bg-amber-950/20 odd:bg-card hover:bg-accent/40 transition-colors divide-x divide-border/30"
                  >
                    <td className="px-3 py-2 text-center text-foreground font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 text-center text-foreground font-medium">
                      {item.dateShort}
                    </td>
                    <td className="px-3 py-2 text-foreground font-normal">
                      {item.item}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-foreground">
                      {formatMoney(item.money)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Link
                        href={`/modules/budget/reports/by-project?pj_activity=${params.pj_activity}&withdraw_id=${item.id}`}
                        className="inline-flex items-center justify-center p-1 rounded hover:bg-muted text-primary"
                        title="ดูรายละเอียดขอยืม/ขอเบิก"
                      >
                        <FileSearch className="w-4 h-4 inline" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {detail.withdrawItems.length > 0 ? (
              <tfoot>
                <tr className="border-t-2 border-border/80 bg-rose-200/80 dark:bg-rose-950/60 font-bold text-foreground divide-x divide-border/60">
                  <td colSpan={3} className="px-4 py-2.5 text-center">
                    รวม
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {formatMoney(detail.totalWithdraw)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>

        {/* Table 2: รายการคืนเงินโครงการ (if returns exist) */}
        {detail.returnItems.length > 0 ? (
          <div className="space-y-3 pt-4">
            <h3 className="text-center font-bold text-teal-800 dark:text-teal-400 text-base">
              รายการคืนเงินโครงการ
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-xs sm:text-sm border-collapse border border-border/60">
                <thead>
                  <tr className="bg-rose-200/80 dark:bg-rose-950/60 text-foreground font-semibold divide-x divide-border/60 border-b border-border/60">
                    <th className="px-3 py-2.5 text-center w-12">ที่</th>
                    <th className="px-3 py-2.5 text-center w-28">ว/ด/ป</th>
                    <th className="px-3 py-2.5 text-left">รายการ</th>
                    <th className="px-3 py-2.5 text-right w-44">จำนวนเงิน</th>
                    <th className="px-2 py-2.5 text-center w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {detail.returnItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="even:bg-amber-50/80 dark:even:bg-amber-950/20 odd:bg-card hover:bg-accent/40 transition-colors divide-x divide-border/30"
                    >
                      <td className="px-3 py-2 text-center text-foreground font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2 text-center text-foreground font-medium">
                        {item.dateShort}
                      </td>
                      <td className="px-3 py-2 text-foreground font-normal">
                        {item.item}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-foreground">
                        {formatMoney(item.money)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <Link
                          href={`/modules/budget/reports/by-project?pj_activity=${params.pj_activity}&return_id=${item.id}`}
                          className="inline-flex items-center justify-center p-1 rounded hover:bg-muted text-primary"
                          title="ดูรายละเอียดการคืนเงิน"
                        >
                          <FileSearch className="w-4 h-4 inline" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border/80 bg-rose-200/80 dark:bg-rose-950/60 font-bold text-foreground divide-x divide-border/60">
                    <td colSpan={3} className="px-4 py-2.5 text-center">
                      รวม
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {formatMoney(detail.totalReturn)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  // Otherwise render main project spending list
  const workgroups = await listSystemWorkgroups();
  const selectedWorkgroup = params.workgroup
    ? Number(params.workgroup)
    : undefined;

  const report = await reportSpendingByProjectList(
    selectedYear,
    selectedWorkgroup,
  );

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden space-y-0">
      {/* Centered Document Title */}
      <div className="py-5 px-4 text-center border-b bg-muted/10 space-y-1">
        <h2 className="text-lg font-bold text-teal-800 dark:text-teal-400 tracking-tight">
          รายงานการใช้จ่ายงบประมาณจำแนกตามโครงการ
        </h2>
        <p className="text-sm font-semibold text-teal-700 dark:text-teal-500">
          สำนักงานเขตพื้นที่การศึกษาประถมศึกษาชัยนาท
        </p>
        <p className="text-xs text-muted-foreground font-medium">
          {report.todayFormatted}
        </p>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <BudgetWorkgroupFilter
            workgroups={workgroups}
            selectedWorkgroup={selectedWorkgroup}
          />
          <BudgetYearFilter years={yearList} selectedYear={selectedYear} />
        </div>
      </div>

      {/* Main Table View */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-xs sm:text-sm border-collapse border border-border/60">
          <thead>
            <tr className="bg-rose-200/80 dark:bg-rose-950/60 text-foreground font-semibold divide-x divide-border/60 border-b border-border/60">
              <th className="px-2 py-3 text-center w-10">ที่</th>
              <th className="px-2 py-3 text-center w-14">รหัส</th>
              <th className="px-3 py-3 text-left w-52">โครงการ</th>
              <th className="px-3 py-3 text-left">กิจกรรม</th>
              <th className="px-3 py-3 text-right w-32">งบประมาณ</th>
              <th className="px-3 py-3 text-right w-32">ใช้จ่าย</th>
              <th className="px-3 py-3 text-right w-32">คงเหลือ</th>
              <th className="px-2 py-3 text-right w-20">%จ่าย</th>
              <th className="px-2 py-3 text-center w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {report.projects.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลโครงการในปีงบประมาณ {selectedYear}
                </td>
              </tr>
            ) : (
              report.projects.map((proj, idx) => (
                <React.Fragment key={proj.id}>
                  {/* Project Parent Row */}
                  <tr className="bg-amber-100/80 dark:bg-amber-950/40 font-semibold divide-x divide-border/40">
                    <td className="px-2 py-2 text-center text-foreground font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-2 text-center text-foreground font-mono">
                      {proj.codeProj}
                    </td>
                    <td
                      colSpan={2}
                      className="px-3 py-2 text-foreground font-medium"
                    >
                      {proj.nameProj}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-rose-600 dark:text-rose-400 font-bold">
                      {formatMoney(proj.budgetProj)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-rose-600 dark:text-rose-400 font-bold">
                      {formatMoney(proj.spentProj)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-rose-600 dark:text-rose-400 font-bold">
                      {formatMoney(proj.remainingProj)}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-rose-600 dark:text-rose-400 font-bold">
                      {proj.percentProj.toFixed(2)}
                    </td>
                    <td className="px-2 py-2" />
                  </tr>

                  {/* Activity Child Rows */}
                  {proj.activities.map((acti) => {
                    const isStopped = acti.stop === 1;
                    return (
                      <tr
                        key={acti.id}
                        className="bg-card hover:bg-accent/40 transition-colors divide-x divide-border/30"
                      >
                        <td className="px-2 py-1.5 text-center" />
                        <td className="px-2 py-1.5 text-center" />
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5 text-foreground">
                          {isStopped ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              ***{" "}
                              <span className="font-mono font-bold mr-1">
                                {acti.codeActi}
                              </span>
                              &nbsp;{acti.nameActi}
                            </span>
                          ) : (
                            <span>
                              <span className="text-blue-600 dark:text-blue-400 font-mono font-bold mr-1">
                                {acti.codeActi}
                              </span>
                              &nbsp;{acti.nameActi}
                            </span>
                          )}
                        </td>
                        <td
                          className={`px-3 py-1.5 text-right font-mono font-bold ${
                            isStopped
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          }`}
                        >
                          {formatMoney(acti.budgetActi)}
                        </td>
                        <td
                          className={`px-3 py-1.5 text-right font-mono ${
                            isStopped
                              ? "text-emerald-600 dark:text-emerald-400 font-medium"
                              : "text-foreground font-normal"
                          }`}
                        >
                          {formatMoney(acti.spentActi)}
                        </td>
                        <td
                          className={`px-3 py-1.5 text-right font-mono ${
                            isStopped
                              ? "text-emerald-600 dark:text-emerald-400 font-medium"
                              : "text-foreground font-normal"
                          }`}
                        >
                          {formatMoney(acti.remainingActi)}
                        </td>
                        <td
                          className={`px-2 py-1.5 text-right font-mono ${
                            isStopped
                              ? "text-emerald-600 dark:text-emerald-400 font-medium"
                              : "text-foreground font-normal"
                          }`}
                        >
                          {acti.percentActi.toFixed(2)}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {acti.spentActi > 0 ? (
                            <Link
                              href={`/modules/budget/reports/by-project?pj_activity=${acti.codeActi}`}
                              className="inline-flex items-center justify-center p-1 rounded hover:bg-muted text-primary"
                              title="ดูรายละเอียดการจ่าย"
                            >
                              <FileSearch className="w-3.5 h-3.5" />
                            </Link>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </tbody>
          {report.projects.length > 0 ? (
            <tfoot>
              <tr className="border-t-2 border-border/80 bg-rose-200/80 dark:bg-rose-950/60 font-bold text-foreground divide-x divide-border/60">
                <td colSpan={3} />
                <td className="px-3 py-2.5 text-center">รวม</td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatMoney(report.totalBudget)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatMoney(report.totalSpent)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">
                  {formatMoney(report.totalRemaining)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono">
                  {report.totalPercent.toFixed(2)}
                </td>
                <td />
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
