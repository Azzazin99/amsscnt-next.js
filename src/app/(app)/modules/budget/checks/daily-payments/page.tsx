import { redirect } from "next/navigation";
import { BudgetDatePicker } from "@/components/budget/budget-date-picker";
import { BudgetNoActiveYear } from "@/components/budget/budget-empty-state";
import { formatMoney } from "@/lib/budget/constants";
import { canViewBudgetChecks } from "@/lib/budget/permissions";
import { getActiveBudgetYear } from "@/lib/budget/queries";
import { reportDailyPaymentsList } from "@/lib/budget/report-queries";
import { requireBudgetAccess } from "@/lib/budget/scope";

type Props = {
  searchParams: Promise<{ date?: string }>;
};

const dayNames = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

const monthNames = [
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

function formatFullThaiDate(dateStr: string) {
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return dateStr;

  const dayOfWeek = dayNames[dateObj.getDay()];
  const [y, m, d] = dateStr.split("-");
  const dayNum = parseInt(d, 10);
  const monthName = monthNames[parseInt(m, 10)] || m;
  const yearBE = parseInt(y, 10) + 543;

  return `รายงานการจ่ายเงิน วัน${dayOfWeek}ที่ ${dayNum} เดือน${monthName} พ.ศ.${yearBE}`;
}

function getPayTypeSuffix(status: number | null) {
  if (status === 3) return " (เงินสด)";
  if (status === 4) return " (เช็ค)";
  return "";
}

export default async function BudgetCheckDailyPaymentsPage({
  searchParams,
}: Props) {
  const { user, perms } = await requireBudgetAccess();
  if (!canViewBudgetChecks(user, perms)) redirect("/modules/budget");

  const params = await searchParams;
  const activeYear = await getActiveBudgetYear();
  if (!activeYear) return <BudgetNoActiveYear />;

  // Default to today's date YYYY-MM-DD if date param not provided
  const todayStr = new Date().toISOString().split("T")[0];
  const selectedDate = params.date || todayStr;

  const report = await reportDailyPaymentsList(
    activeYear.budgetYear,
    selectedDate,
  );

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden space-y-0">
      {/* Integrated Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b bg-muted/20">
        <div>
          <h2 className="text-base font-semibold text-teal-800 dark:text-teal-400 tracking-tight">
            {formatFullThaiDate(selectedDate)}
          </h2>
        </div>
        <BudgetDatePicker selectedDate={selectedDate} />
      </div>

      {/* Main Content */}
      {report.items.length === 0 ? (
        <div className="px-4 py-12 text-center text-red-600 dark:text-red-400 font-bold text-base sm:text-lg">
          ไม่มีรายการจ่ายวันนี้
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm border-collapse">
            <thead>
              <tr className="border-b bg-rose-200/70 dark:bg-rose-950/50 text-foreground font-semibold">
                <th className="px-3 py-3 text-center w-12">ที่</th>
                <th className="px-3 py-3 text-left">รายการ</th>
                <th className="px-3 py-3 text-right w-36">จำนวนเงิน</th>
                <th className="px-3 py-3 text-left w-40">ผู้รับเงิน</th>
                <th className="px-3 py-3 text-center w-40">หลักฐานการจ่าย</th>
                <th className="px-3 py-3 text-left w-48">ผู้จ่ายเงิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {report.items.map((item, idx) => (
                <tr
                  key={item.id}
                  className="even:bg-amber-50/70 dark:even:bg-amber-950/20 odd:bg-card hover:bg-accent/40 transition-colors"
                >
                  <td className="px-3 py-2.5 text-center text-foreground font-medium">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2.5 text-foreground">{item.item}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-foreground">
                    {formatMoney(item.payAmount)}
                  </td>
                  <td className="px-3 py-2.5 text-foreground">
                    {item.payee || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center text-foreground">
                    {item.checkNumber || "—"}
                    {getPayTypeSuffix(item.status)}
                  </td>
                  <td className="px-3 py-2.5 text-foreground">
                    {item.payerFullName}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border/80 bg-rose-200/70 dark:bg-rose-950/50 font-bold text-foreground">
                <td colSpan={2} className="px-4 py-3 text-center">
                  รวมจ่ายทั้งหมด
                </td>
                <td className="px-3 py-3 text-right font-mono">
                  {formatMoney(report.totalPayAmount)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Unpaid & Overdue Footnotes */}
      <div className="p-4 border-t bg-muted/10 space-y-1.5 text-xs sm:text-sm text-foreground">
        <div>
          <span className="font-bold text-red-600 dark:text-red-400">
            ค้างจ่าย
          </span>
          <span className="ml-1">
            ปีงบประมาณนี้ จำนวน{" "}
            <span className="font-semibold">{report.unpaidCount}</span> รายการ
            เป็นเงิน{" "}
            <span className="font-semibold font-mono">
              {formatMoney(report.unpaidAmount)}
            </span>{" "}
            บาท
          </span>
        </div>

        <div>
          <span className="font-bold text-red-600 dark:text-red-400">
            ค้างจ่ายเกิน 15 วัน
          </span>
          <span className="ml-1">
            ปีงบประมาณนี้ จำนวน{" "}
            <span className="font-semibold">{report.overdue15Count}</span>{" "}
            รายการ เป็นเงิน{" "}
            <span className="font-semibold font-mono">
              {formatMoney(report.overdue15Amount)}
            </span>{" "}
            บาท
          </span>
        </div>
      </div>
    </section>
  );
}
