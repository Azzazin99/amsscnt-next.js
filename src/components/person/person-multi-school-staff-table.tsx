"use client";

import Link from "next/link";
import { ImageIcon, Pencil, Plus, Users, X } from "lucide-react";
import { PersonDeactivateButton } from "./person-deactivate-button";
import type { PersonListRow } from "@/lib/person/queries";

type PersonMultiSchoolStaffTableProps = {
  rows: PersonListRow[];
  canWrite: boolean;
  canDelete: boolean;
  pageOffset: number;
};

export function PersonMultiSchoolStaffTable({
  rows,
  canWrite,
  canDelete,
  pageOffset,
}: PersonMultiSchoolStaffTableProps) {
  return (
    <div className="space-y-4">
      {/* Centered header title matching legacy person_sch_other.php */}
      <div className="py-2 text-center">
        <h2 className="text-lg font-bold text-[#006666] dark:text-emerald-400">
          บุคลากรในสถานศึกษา ปฏิบัติงานมากกว่า 1 แห่ง
        </h2>
      </div>

      <div className="overflow-x-auto rounded-lg border border-pink-300 bg-card shadow-sm dark:border-pink-950/60">
        <table className="w-full min-w-[980px] border-collapse border border-pink-300 text-xs md:text-sm dark:border-pink-900/60">
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
              <th className="w-16 border border-pink-300 px-2 py-2.5 text-center font-medium dark:border-pink-900/60">
                รูปภาพ
              </th>
              <th className="w-20 border border-pink-300 px-2 py-2.5 text-center font-medium dark:border-pink-900/60">
                เพิ่มข้อมูล
              </th>
              <th className="w-16 border border-pink-300 px-2 py-2.5 text-center font-medium dark:border-pink-900/60">
                ลบ
              </th>
              <th className="w-16 border border-pink-300 px-2 py-2.5 text-center font-medium dark:border-pink-900/60">
                แก้ไข
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
                  ไม่พบข้อมูลบุคลากรปฏิบัติงานมากกว่า 1 แห่ง
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const rowNum = pageOffset + index + 1;
                const extraSchools = row.extraSchools ?? [];

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
                    <td className="border border-pink-200 px-3 py-2 text-slate-800 dark:border-pink-950/40 dark:text-slate-200">
                      <div className="space-y-1">
                        <div>
                          <span>{row.schoolName ?? "—"}</span>
                          <span className="ml-1 text-xs font-semibold text-red-600 dark:text-red-400">
                            (สถานศึกษาหลัก)
                          </span>
                        </div>
                        {extraSchools.map((s) => (
                          <div key={s.id} className="text-xs text-slate-600 dark:text-slate-300">
                            • {s.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="border border-pink-200 px-2 py-2 text-center dark:border-pink-950/40">
                      {row.pictureUrl ? (
                        <ImageIcon className="mx-auto size-4 text-blue-600 dark:text-blue-400" />
                      ) : index % 3 === 0 ? (
                        <Users className="mx-auto size-4 text-slate-500 dark:text-slate-400" />
                      ) : null}
                    </td>
                    <td className="border border-pink-200 px-2 py-2 text-center dark:border-pink-950/40">
                      {canWrite ? (
                        <Link
                          href={`/modules/person/staff/${row.id}/edit`}
                          className="inline-flex size-7 items-center justify-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400"
                          title="เพิ่มข้อมูลสถานศึกษาที่ปฏิบัติงาน"
                        >
                          <Plus className="size-4" />
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="border border-pink-200 px-2 py-2 text-center dark:border-pink-950/40">
                      {canDelete && row.status === 0 ? (
                        <PersonDeactivateButton id={row.id} />
                      ) : (
                        <X className="mx-auto size-4 text-red-500/40" />
                      )}
                    </td>
                    <td className="border border-pink-200 px-2 py-2 text-center dark:border-pink-950/40">
                      {canWrite ? (
                        <Link
                          href={`/modules/person/staff/${row.id}/edit`}
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
