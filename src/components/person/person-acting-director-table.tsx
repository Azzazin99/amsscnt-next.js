"use client";

import Link from "next/link";
import { Pencil, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatThaiDate } from "@/lib/format/thai-date";
import type { ActingDirectorRow } from "@/lib/person/queries";
import { deleteActingDirector } from "@/lib/person/actions";

type PersonActingDirectorTableProps = {
  rows: ActingDirectorRow[];
  canWrite: boolean;
  canDelete: boolean;
  pageOffset: number;
};

export function PersonActingDirectorTable({
  rows,
  canWrite,
  canDelete,
  pageOffset,
}: PersonActingDirectorTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: number) {
    if (!confirm("คุณต้องการลบผู้รักษาการในตำแหน่งนี้ใช่หรือไม่?")) return;
    startTransition(async () => {
      const res = await deleteActingDirector(id);
      if (!res.ok) {
        alert(res.message);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Header Title matching legacy delegate_sch.php */}
      <div className="py-2 text-center">
        <h2 className="text-lg font-bold text-[#006666] dark:text-emerald-400">
          ผู้รักษาการในตำแหน่ง
        </h2>
        <p className="text-base font-bold text-[#006666] dark:text-emerald-400">
          ผู้อำนวยการโรงเรียน
        </p>
      </div>

      {/* Top action button matching screenshot */}
      <div>
        {canWrite ? (
          <Link
            href="/modules/person/staff/new-acting"
            className="inline-flex items-center rounded border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs text-slate-800 shadow-sm hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            เพิ่มผู้รักษาการในตำแหน่ง
          </Link>
        ) : null}
      </div>

      {/* Table section matching 2-row header screenshot layout */}
      <div className="overflow-x-auto rounded-lg border border-pink-300 bg-card shadow-sm dark:border-pink-950/60">
        <table className="w-full min-w-[950px] border-collapse border border-pink-300 text-xs md:text-sm dark:border-pink-900/60">
          <thead>
            <tr className="bg-[#FFCCCC] text-slate-800 dark:bg-pink-950/80 dark:text-slate-100">
              <th
                rowSpan={2}
                className="w-12 border border-pink-300 px-2 py-2.5 text-center font-medium dark:border-pink-900/60"
              >
                ที่
              </th>
              <th
                rowSpan={2}
                className="w-44 border border-pink-300 px-3 py-2.5 text-left font-medium dark:border-pink-900/60"
              >
                โรงเรียน
              </th>
              <th
                colSpan={2}
                className="border border-pink-300 px-2 py-1.5 text-center font-medium dark:border-pink-900/60"
              >
                วันรักษาการในตำแหน่ง
              </th>
              <th
                rowSpan={2}
                className="border border-pink-300 px-3 py-2.5 text-left font-medium dark:border-pink-900/60"
              >
                ผู้รักษาการในตำแหน่ง
              </th>
              <th
                rowSpan={2}
                className="border border-pink-300 px-3 py-2.5 text-left font-medium dark:border-pink-900/60"
              >
                ตำแหน่ง
              </th>
              <th
                rowSpan={2}
                className="border border-pink-300 px-3 py-2.5 text-left font-medium dark:border-pink-900/60"
              >
                หมายเหตุ
              </th>
              <th
                rowSpan={2}
                className="w-14 border border-pink-300 px-2 py-2.5 text-center font-medium dark:border-pink-900/60"
              >
                ลบ
              </th>
              <th
                rowSpan={2}
                className="w-14 border border-pink-300 px-2 py-2.5 text-center font-medium dark:border-pink-900/60"
              >
                แก้ไข
              </th>
            </tr>
            <tr className="bg-[#CC9900] text-slate-900 dark:bg-amber-800 dark:text-slate-100">
              <th className="w-28 border border-pink-300 px-2 py-1.5 text-center font-medium dark:border-pink-900/60">
                เริ่ม
              </th>
              <th className="w-28 border border-pink-300 px-2 py-1.5 text-center font-medium dark:border-pink-900/60">
                สิ้นสุด
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="border border-pink-300 px-3 py-8 text-center text-muted-foreground dark:border-pink-900/60"
                >
                  ไม่พบข้อมูลผู้รักษาการในตำแหน่ง ผอ.รร.
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
                    <td className="border border-pink-200 px-3 py-2 text-slate-900 dark:border-pink-950/40 dark:text-slate-100">
                      {row.schoolName}
                    </td>
                    <td className="border border-pink-200 px-2 py-2 text-center text-xs text-slate-700 dark:border-pink-950/40 dark:text-slate-300">
                      {formatThaiDate(row.start)}
                    </td>
                    <td className="border border-pink-200 px-2 py-2 text-center text-xs text-slate-700 dark:border-pink-950/40 dark:text-slate-300">
                      {formatThaiDate(row.finish)}
                    </td>
                    <td className="border border-pink-200 px-3 py-2 text-slate-900 dark:border-pink-950/40 dark:text-slate-100">
                      {row.displayName}
                    </td>
                    <td className="border border-pink-200 px-3 py-2 text-slate-800 dark:border-pink-950/40 dark:text-slate-200">
                      {row.positionLabel}
                    </td>
                    <td className="border border-pink-200 px-3 py-2 text-slate-700 dark:border-pink-950/40 dark:text-slate-300">
                      {row.remark || "—"}
                    </td>
                    <td className="border border-pink-200 px-2 py-2 text-center dark:border-pink-950/40">
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          disabled={isPending}
                          title="ลบ"
                          className="inline-flex size-7 items-center justify-center rounded text-red-600 hover:bg-rose-100 dark:text-red-400 dark:hover:bg-rose-950"
                        >
                          <X className="size-4" />
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="border border-pink-200 px-2 py-2 text-center dark:border-pink-950/40">
                      {canWrite ? (
                        <Link
                          href={`/modules/person/staff/acting/${row.id}/edit`}
                          className="inline-flex size-7 items-center justify-center rounded hover:bg-muted"
                          aria-label="แก้ไข"
                        >
                          <Pencil className="size-4 text-amber-600 dark:text-amber-400" />
                        </Link>
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
    </div>
  );
}
