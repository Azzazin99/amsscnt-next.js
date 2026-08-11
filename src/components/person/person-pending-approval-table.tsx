"use client";

import { Check, X } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approvePerson, deletePersonPermanent } from "@/lib/person/actions";
import type { PersonListRow } from "@/lib/person/queries";

type PersonPendingApprovalTableProps = {
  rows: PersonListRow[];
  pageOffset: number;
  canWrite: boolean;
};

export function PersonPendingApprovalTable({
  rows,
  pageOffset,
  canWrite,
}: PersonPendingApprovalTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleApprove(id: number) {
    if (!confirm("คุณต้องการรับรองรายการนี้ใช่หรือไม่?")) return;
    startTransition(async () => {
      const res = await approvePerson(id);
      if (!res.ok) {
        alert(res.message);
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete(id: number) {
    if (!confirm("คุณต้องการไม่รับรอง (ลบรายการนี้) ใช่หรือไม่?\nข้อมูลจะถูกลบถาวร")) return;
    startTransition(async () => {
      const res = await deletePersonPermanent(id);
      if (!res.ok) {
        alert(res.message);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Header section matching legacy title */}
      <div className="py-2 text-center">
        <h2 className="text-lg font-bold text-[#006666] dark:text-emerald-400">
          ข้อมูลครูและบุคลากรในสถานศึกษา (รอการรับรอง)
        </h2>
        <p className="text-sm font-semibold text-[#006666] dark:text-emerald-400">
          (เป็นข้อมูลครูและบุคลากรจากระบบ SMSS ที่เข้าใช้งาน AMSS++)
        </p>
      </div>

      {/* Table section */}
      <div className="overflow-x-auto rounded-lg border border-pink-300 bg-card shadow-sm dark:border-pink-950/60">
        <table className="w-full min-w-[850px] border-collapse border border-pink-300 text-xs md:text-sm dark:border-pink-900/60">
          <thead>
            <tr className="bg-[#FFCCCC] text-slate-800 dark:bg-pink-950/80 dark:text-slate-100">
              <th className="w-16 border border-pink-300 px-2 py-2.5 text-center font-medium dark:border-pink-900/60">
                ที่
              </th>
              <th className="w-36 border border-pink-300 px-3 py-2.5 text-left font-medium dark:border-pink-900/60">
                เลขประชาชน
              </th>
              <th className="border border-pink-300 px-3 py-2.5 text-left font-medium dark:border-pink-900/60">
                ชื่อ
              </th>
              <th className="border border-pink-300 px-3 py-2.5 text-left font-medium dark:border-pink-900/60">
                ตำแหน่ง
              </th>
              <th className="border border-pink-300 px-3 py-2.5 text-left font-medium dark:border-pink-900/60">
                สถานศึกษา
              </th>
              <th className="w-20 border border-pink-300 px-2 py-2.5 text-center font-medium dark:border-pink-900/60">
                รับรอง
              </th>
              <th className="w-24 border border-pink-300 px-2 py-2.5 text-center font-medium dark:border-pink-900/60">
                ไม่รับรอง<br />(ลบ)
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="border border-pink-300 px-3 py-8 text-center text-muted-foreground dark:border-pink-900/60"
                >
                  ไม่มีข้อมูลรอการรับรอง
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const rowNum = pageOffset + index + 1;

                return (
                  <tr
                    key={row.id}
                    className={
                      index % 2 === 0
                        ? "bg-[#FFFFCC] hover:bg-amber-100/50 dark:bg-amber-950/20 dark:hover:bg-amber-900/30"
                        : "bg-white hover:bg-amber-50/50 dark:bg-card dark:hover:bg-amber-950/20"
                    }
                  >
                    <td className="border border-pink-200 px-2 py-2 text-center font-mono text-xs dark:border-pink-950/40">
                      {rowNum}
                    </td>
                    <td className="border border-pink-200 px-3 py-2 font-mono text-xs font-medium text-slate-800 dark:border-pink-950/40 dark:text-slate-200">
                      {row.personId}
                    </td>
                    <td className="border border-pink-200 px-3 py-2 text-slate-900 dark:border-pink-950/40 dark:text-slate-100">
                      {row.displayName}
                    </td>
                    <td className="border border-pink-200 px-3 py-2 text-slate-800 dark:border-pink-950/40 dark:text-slate-200">
                      {row.positionLabel}
                    </td>
                    <td className="border border-pink-200 px-3 py-2 text-slate-700 dark:border-pink-950/40 dark:text-slate-300">
                      {row.schoolName ?? "—"}
                    </td>
                    <td className="border border-pink-200 px-2 py-2 text-center dark:border-pink-950/40">
                      {canWrite ? (
                        <button
                          type="button"
                          onClick={() => handleApprove(row.id)}
                          disabled={isPending}
                          title="รับรอง"
                          className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                        >
                          <Check className="size-4 stroke-[3]" />
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="border border-pink-200 px-2 py-2 text-center dark:border-pink-950/40">
                      {canWrite ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          disabled={isPending}
                          title="ไม่รับรอง (ลบ)"
                          className="inline-flex size-7 items-center justify-center rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300"
                        >
                          <X className="size-4 stroke-[3]" />
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legacy Footer note */}
      <p className="text-xs text-slate-600 dark:text-slate-400">
        ตรวจสอบว่าเป็นครูและบุคลากรถูกต้องหรือไม่ หากถูกต้องคลิกปุ่มรับรอง หากไม่ถูกต้องให้คลิกไม่รับรอง(ข้อมูลจากจะถูกลบ)
      </p>
    </div>
  );
}
