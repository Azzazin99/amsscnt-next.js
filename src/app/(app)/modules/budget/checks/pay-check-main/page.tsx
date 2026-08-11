import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { BudgetYearFilter } from "@/components/budget/budget-year-filter";
import { AppPagination } from "@/components/ui/app-pagination";
import { formatMoney } from "@/lib/budget/constants";
import { canViewBudgetChecks } from "@/lib/budget/permissions";
import { getActiveBudgetYear, listBudgetYears } from "@/lib/budget/queries";
import {
  getReportPayCheckDetail,
  reportPayCheckMain,
} from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = {
  searchParams: Promise<{ year?: string; page?: string; id?: string }>;
};

const fullThaiMonths = [
  "",
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

function formatShortThaiDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  const months = [
    "",
    "มค",
    "กพ",
    "มีค",
    "เมย",
    "พค",
    "มิย",
    "กค",
    "สค",
    "กย",
    "ตค",
    "พย",
    "ธค",
  ];
  const year2Digits = (parseInt(y, 10) + 543) % 100;
  return `${parseInt(d, 10)} ${months[parseInt(m, 10)] || m} ${year2Digits}`;
}

function getMoneyTypeText(typeId: number | null) {
  if (typeId == null) return "—";
  if (typeId < 200) return "เงินนอกงบประมาณ";
  if (typeId === 200) return "เงินงบประมาณ";
  return "เงินรายได้แผ่นดิน";
}

function getStatusText(status: number | null) {
  if (status === 1) return "รับเงินสด";
  if (status === 2) return "รับเช็ค/เงินฝากธนาคาร";
  if (status === 3) return "จ่ายเงินสด";
  if (status === 4) return "จ่ายเช็ค/เงินฝากธนาคาร";
  return "—";
}

export default async function BudgetCheckPayMainPage({ searchParams }: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canViewBudgetChecks(user, perms)) redirect("/modules/budget");

  const params = await searchParams;
  const activeYear = await getActiveBudgetYear();
  const allYears = await listBudgetYears();

  if (!activeYear && allYears.length === 0) return <BudgetNoActiveYear />;

  const yearList = allYears.map((y) => y.budgetYear);
  const selectedYear = params.year
    ? Number(params.year)
    : (activeYear?.budgetYear ?? yearList[0]);
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));

  // If Detail View requested via ?id=...
  if (params.id) {
    const detail = await getReportPayCheckDetail(Number(params.id));
    if (detail) {
      const [recY, recM, recD] = (detail.recDate || "").split("-");
      const dayVal = recD ? parseInt(recD, 10) : "";
      const monthVal = recM ? fullThaiMonths[parseInt(recM, 10)] || "" : "";
      const yearVal = recY ? parseInt(recY, 10) + 543 : "";

      const approveText =
        detail.approve === 1
          ? "อนุมัติให้จ่ายเงินได้"
          : detail.approve === 2
            ? "ไม่อนุมัติ"
            : "รอการอนุมัติ";

      return (
        <div className="space-y-6 max-w-4xl mx-auto py-2">
          {/* Title & Back Button */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-teal-800 dark:text-teal-400">
              รายละเอียดการจ่ายเงิน ปีงบประมาณ{detail.budgetYear}
            </h2>
            <Link
              href={`/modules/budget/checks/pay-check-main?year=${selectedYear}&page=${currentPage}`}
              className="px-3.5 py-1.5 rounded-lg border border-input bg-background hover:bg-accent text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs"
            >
              &laquo; กลับหน้าก่อน
            </Link>
          </div>

          {/* Form Card Container */}
          <div className="p-6 rounded-xl border bg-card shadow-sm space-y-6">
            {/* General Pay Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <label className="w-40 text-right text-muted-foreground font-medium">
                  วันที่
                </label>
                <input
                  type="text"
                  value={dayVal}
                  readOnly
                  className="h-9 w-24 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="w-40 text-right text-muted-foreground font-medium">
                  เดือน
                </label>
                <input
                  type="text"
                  value={monthVal}
                  readOnly
                  className="h-9 w-36 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="w-40 text-right text-muted-foreground font-medium">
                  ปี
                </label>
                <input
                  type="text"
                  value={yearVal}
                  readOnly
                  className="h-9 w-24 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="w-40 text-right text-muted-foreground font-medium">
                  ที่เอกสาร
                </label>
                <input
                  type="text"
                  value={detail.doc}
                  readOnly
                  className="h-9 flex-1 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                />
              </div>

              <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                <label className="w-40 text-right text-muted-foreground font-medium whitespace-nowrap">
                  อ้างอิงทะเบียนขอเบิก/ขอยืมเงิน
                </label>
                <input
                  type="text"
                  value={
                    detail.referWdId
                      ? `${detail.referWdId} ${detail.referWdItem || ""}`.trim()
                      : "—"
                  }
                  readOnly
                  className="h-9 flex-1 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                />
              </div>

              <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                <label className="w-40 text-right text-muted-foreground font-medium whitespace-nowrap">
                  ประเภทของเงิน
                </label>
                <input
                  type="text"
                  value={getMoneyTypeText(detail.typeId)}
                  readOnly
                  className="h-9 flex-1 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                />
              </div>

              <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                <label className="w-40 text-right text-muted-foreground font-medium whitespace-nowrap">
                  รายการจ่าย
                </label>
                <input
                  type="text"
                  value={detail.item}
                  readOnly
                  className="h-9 flex-1 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                />
              </div>

              <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                <label className="w-40 text-right text-muted-foreground font-medium whitespace-nowrap">
                  ประเภทรายการจ่าย
                </label>
                <input
                  type="text"
                  value={detail.payGroupName || "—"}
                  readOnly
                  className="h-9 w-48 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="w-40 text-right text-muted-foreground font-medium">
                  จำนวนเงิน
                </label>
                <input
                  type="text"
                  value={formatMoney(detail.payAmount)}
                  readOnly
                  className="h-9 w-40 rounded-md border border-input bg-muted/20 px-3 text-sm font-mono text-foreground"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="w-40 text-right text-muted-foreground font-medium">
                  ผู้รับเงิน
                </label>
                <input
                  type="text"
                  value={detail.payedPerson || "—"}
                  readOnly
                  className="h-9 w-48 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                />
              </div>

              <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                <label className="w-40 text-right text-muted-foreground font-medium">
                  เจ้าหน้าที่
                </label>
                <input
                  type="text"
                  value={detail.officerFullName}
                  readOnly
                  className="h-9 w-64 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                />
              </div>
            </div>

            {/* Fieldset: ส่วนของการอนุมัติ */}
            <fieldset className="rounded-xl border p-4 border-border/80 space-y-4">
              <legend className="px-2 text-sm font-bold text-foreground">
                ส่วนของการอนุมัติ:
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                  <label className="w-40 text-right text-muted-foreground font-medium">
                    การอนุมัติ
                  </label>
                  <input
                    type="text"
                    value={approveText}
                    readOnly
                    className="h-9 w-48 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                  />
                </div>

                <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                  <label className="w-40 text-right text-muted-foreground font-medium">
                    ผู้อนุมัติ
                  </label>
                  <input
                    type="text"
                    value={detail.approveFullName}
                    readOnly
                    className="h-9 w-64 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                  />
                </div>

                <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                  <label className="w-40 text-right text-muted-foreground font-medium">
                    วันอนุมัติ (ปี เดือน วัน)
                  </label>
                  <input
                    type="text"
                    value={detail.approveDate || "—"}
                    readOnly
                    className="h-9 w-40 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                  />
                </div>
              </div>
            </fieldset>

            {/* Fieldset: ส่วนของการจ่าย */}
            <fieldset className="rounded-xl border p-4 border-border/80 space-y-4">
              <legend className="px-2 text-sm font-bold text-foreground">
                ส่วนของการจ่าย:
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                  <label className="w-40 text-right text-muted-foreground font-medium">
                    ลักษณะการจ่าย
                  </label>
                  <input
                    type="text"
                    value={getStatusText(detail.status)}
                    readOnly
                    className="h-9 w-48 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                  />
                </div>

                <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                  <label className="w-40 text-right text-muted-foreground font-medium">
                    หลักฐานการจ่าย
                  </label>
                  <input
                    type="text"
                    value={detail.checkNumber || "—"}
                    readOnly
                    className="h-9 w-64 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                  />
                </div>

                <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                  <label className="w-40 text-right text-muted-foreground font-medium">
                    ผู้รับเงิน
                  </label>
                  <input
                    type="text"
                    value={detail.payee || "—"}
                    readOnly
                    className="h-9 w-64 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                  />
                </div>

                <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                  <label className="w-40 text-right text-muted-foreground font-medium">
                    ผู้จ่ายเงิน
                  </label>
                  <input
                    type="text"
                    value={detail.payerFullName}
                    readOnly
                    className="h-9 w-64 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                  />
                </div>

                <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                  <label className="w-40 text-right text-muted-foreground font-medium">
                    วันจ่ายเงิน (ปี เดือน วัน)
                  </label>
                  <input
                    type="text"
                    value={detail.payDate || "—"}
                    readOnly
                    className="h-9 w-40 rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground"
                  />
                </div>
              </div>
            </fieldset>
          </div>
        </div>
      );
    }
  }

  // Default List View
  const items = await reportPayCheckMain(selectedYear);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pageItems = items.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden space-y-0">
      {/* Integrated Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b bg-muted/20">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            จ่ายเงินประเภทหลัก ปีงบประมาณ {selectedYear}
          </h2>
        </div>
        <BudgetYearFilter years={yearList} selectedYear={selectedYear} />
      </div>

      {/* Top Pagination Bar */}
      <AppPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={items.length}
        pageSize={pageSize}
      />

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm border-collapse">
          <thead>
            <tr className="border-b bg-muted/60 text-foreground font-semibold">
              <th className="px-3 py-3 text-center w-12">ที่</th>
              <th className="px-3 py-3 text-left w-24">วดป</th>
              <th className="px-3 py-3 text-left">รายการ</th>
              <th className="px-3 py-3 text-right w-32">จำนวนเงิน</th>
              <th className="px-3 py-3 text-left w-36">ประเภทเงิน</th>
              <th className="px-3 py-3 text-center w-24">รายละเอียด</th>
              <th className="px-3 py-3 text-center w-20">อนุมัติ</th>
              <th className="px-3 py-3 text-center w-20">จ่ายเงิน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {pageItems.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลรายการจ่ายเงิน
                </td>
              </tr>
            ) : (
              pageItems.map((item, idx) => {
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;

                // Approve Status Badge
                const isApproved = item.approve === 1;
                const isRejected = item.approve === 2;

                // Pay Status Badge
                const isPaid = Boolean(
                  item.checkNumber && item.checkNumber.trim() !== "",
                );

                return (
                  <tr
                    key={item.id}
                    className="even:bg-muted/15 odd:bg-card hover:bg-accent/40 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-center text-muted-foreground text-xs sm:text-sm">
                      {globalIndex}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs sm:text-sm">
                      {formatShortThaiDate(item.recDate)}
                    </td>
                    <td className="px-3 py-2.5 text-xs sm:text-sm">
                      {item.item}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs sm:text-sm">
                      {formatMoney(item.payAmount)}
                    </td>
                    <td className="px-3 py-2.5 text-xs sm:text-sm text-muted-foreground">
                      {getMoneyTypeText(item.typeId)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Link
                        href={`/modules/budget/checks/pay-check-main?id=${item.id}&year=${selectedYear}&page=${currentPage}`}
                        className="inline-flex items-center justify-center p-1.5 rounded-md hover:bg-muted text-primary transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <FileText className="w-4 h-4" />
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {isApproved ? (
                        <span
                          className="inline-block w-4 h-4 rounded-sm bg-emerald-500 shadow-sm"
                          title="อนุมัติให้จ่ายเงินได้"
                        />
                      ) : isRejected ? (
                        <span
                          className="inline-block w-4 h-4 rounded-sm bg-red-500 shadow-sm"
                          title="ไม่อนุมัติ"
                        />
                      ) : (
                        <span
                          className="inline-block w-4 h-4 rounded-sm bg-yellow-400 shadow-sm"
                          title="รอการอนุมัติ"
                        />
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {isPaid ? (
                        <span
                          className="inline-block w-4 h-4 rounded-sm bg-emerald-500 shadow-sm"
                          title="จ่ายเงินแล้ว"
                        />
                      ) : (
                        <span
                          className="inline-block w-4 h-4 rounded-sm bg-red-500 shadow-sm"
                          title="ยังไม่ได้จ่ายเงิน"
                        />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination Bar */}
      <AppPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={items.length}
        pageSize={pageSize}
      />

      {/* Legend Footer */}
      <div className="p-4 border-t bg-muted/10">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium text-foreground/80">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-yellow-400 inline-block shadow-sm" />
            <span>รอการอนุมัติ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500 inline-block shadow-sm" />
            <span>อนุมัติให้จ่ายเงินได้ / จ่ายเงินแล้ว</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-red-500 inline-block shadow-sm" />
            <span>ไม่อนุมัติ / ยังไม่ได้จ่ายเงิน</span>
          </div>
        </div>
      </div>
    </section>
  );
}
