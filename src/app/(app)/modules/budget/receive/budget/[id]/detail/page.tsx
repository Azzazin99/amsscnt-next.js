import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Paperclip } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/budget/constants";
import { getBudgetReceive } from "@/lib/budget/queries";
import { requireBudgetAccess } from "@/lib/budget/scope";
import { formatThaiDate } from "@/lib/format/thai-date";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function BudgetReceiveDetailPage({ params }: Props) {
  await requireBudgetAccess();
  
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (Number.isNaN(id)) notFound();

  const row = await getBudgetReceive(id);
  if (!row) notFound();

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          รายละเอียด การโอนเปลี่ยนแปลงการจัดสรรงบประมาณรายจ่าย ปีงบประมาณ {row.budgetYear}
        </h2>
        <Link
          href="/modules/budget/receive/budget"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 font-semibold shadow-sm",
          )}
        >
          &lt;&lt;กลับไปก่อนหน้า
        </Link>
      </div>

      <div className="mx-auto max-w-4xl rounded-lg p-6 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[200px_1fr] items-center">
          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200">เลขที่ใบงวด</div>
          <div><input readOnly value={row.num} className="flex h-9 w-full rounded-md border border-slate-300 bg-white dark:bg-slate-950 px-3 py-1 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-xs max-w-[200px]" /></div>

          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200">เลขที่หนังสือ</div>
          <div><input readOnly value={row.bookNumber || ""} className="flex h-9 w-full rounded-md border border-slate-300 bg-white dark:bg-slate-950 px-3 py-1 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-xs max-w-md" /></div>

          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200">ลงวันที่</div>
          <div><input readOnly value={row.outDate || ""} className="flex h-9 w-full rounded-md border border-slate-300 bg-white dark:bg-slate-950 px-3 py-1 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-xs max-w-md" /></div>

          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200">อ้างอิงหนังสือจัดสรร</div>
          <div><input readOnly value={row.bookRef || ""} className="flex h-9 w-full rounded-md border border-slate-300 bg-white dark:bg-slate-950 px-3 py-1 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-xs max-w-md" /></div>

          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200">แผนงาน</div>
          <div><input readOnly value={row.plan || ""} className="flex h-9 rounded-md border border-slate-300 bg-white dark:bg-slate-950 px-3 py-1 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-xs w-full" /></div>

          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200">ผลผลิต/โครงการ</div>
          <div><input readOnly value={row.project || ""} className="flex h-9 rounded-md border border-slate-300 bg-white dark:bg-slate-950 px-3 py-1 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-xs w-full" /></div>

          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200">กิจกรรมหลัก</div>
          <div><input readOnly value={row.activity || ""} className="flex h-9 rounded-md border border-slate-300 bg-white dark:bg-slate-950 px-3 py-1 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-xs w-full" /></div>

          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200 self-start mt-2">กิจกรรมหลักเพิ่มเติม</div>
          <div><textarea readOnly value={row.activity2 || ""} className="flex min-h-[60px] rounded-md border border-slate-300 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-xs w-full" /></div>

          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200">แหล่งของเงิน</div>
          <div><input readOnly value={row.mSource || ""} className="flex h-9 w-full rounded-md border border-slate-300 bg-white dark:bg-slate-950 px-3 py-1 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-xs max-w-2xl" /></div>

          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200">รหัสบัญชี</div>
          <div><input readOnly value={row.account || ""} className="flex h-9 w-full rounded-md border border-slate-300 bg-white dark:bg-slate-950 px-3 py-1 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-xs max-w-xs" /></div>

          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200">งบรายจ่าย</div>
          <div><input readOnly value={row.mPay || ""} className="flex h-9 w-full rounded-md border border-slate-300 bg-white dark:bg-slate-950 px-3 py-1 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-xs max-w-2xl" /></div>

          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200 self-start mt-2">รายการ</div>
          <div><textarea readOnly value={row.item} className="flex min-h-[60px] rounded-md border border-slate-300 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-xs w-full" /></div>

          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200 self-start mt-2">รายละเอียด</div>
          <div><textarea readOnly value={row.detail || ""} className="flex min-h-[60px] w-full rounded-md border border-slate-300 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-xs max-w-2xl" /></div>

          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200">จำนวนเงิน</div>
          <div className="flex items-center gap-2">
            <input readOnly value={formatMoney(row.money)} className="flex h-9 w-full rounded-md border border-slate-300 bg-white dark:bg-slate-950 px-3 py-1 text-sm font-bold text-slate-900 dark:text-slate-100 shadow-xs max-w-[200px]" />
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">บาท</span>
          </div>

          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200">บันทึกข้อมูล</div>
          <div><input readOnly value={row.recDate ? formatThaiDate(row.recDate) : ""} className="flex h-9 w-full rounded-md border border-slate-300 bg-white dark:bg-slate-950 px-3 py-1 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-xs max-w-[200px]" /></div>

          <div className="text-sm font-semibold sm:text-right text-slate-800 dark:text-slate-200">ไฟล์เอกสาร</div>
          <div className="flex items-center">
            {row.file ? (
              <a href={`/${row.file}`} target="_blank" rel="noreferrer" className="text-slate-700 hover:text-slate-900 p-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded shadow-xs">
                <FileText className="size-5" />
              </a>
            ) : (
              <span className="p-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded text-slate-400">
                <FileText className="size-5" />
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
