"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, X, Users, Image as ImageIcon } from "lucide-react";
import { PersonListRow } from "@/lib/person/queries";
import { PersonDeactivateButton } from "@/components/person/person-deactivate-button";
import { Button } from "@/components/ui/button";
import { formatThaiShortDate } from "@/components/person/person-district-staff-table";

type Props = {
  rows: PersonListRow[];
  canWrite: boolean;
  canDelete: boolean;
  pageOffset: number;
};

export function PersonSchoolStaffTable({
  rows,
  canWrite,
  canDelete,
  pageOffset,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const isAllSelected =
    rows.length > 0 && selectedIds.length === rows.length;

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map((r) => r.id));
    }
  }

  function toggleSelectRow(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-pink-300 bg-card shadow-sm dark:border-pink-950/60">
        <table className="w-full min-w-[980px] border-collapse border border-pink-300 text-xs md:text-sm dark:border-pink-900/60">
          <thead>
            <tr className="bg-pink-100/80 text-slate-800 dark:bg-pink-950/60 dark:text-slate-100">
              <th className="w-16 border border-pink-300 px-2 py-2.5 text-center font-medium dark:border-pink-900/60">ที่</th>
              <th className="w-36 border border-pink-300 px-3 py-2.5 font-medium dark:border-pink-900/60">เลขประชาชน</th>
              <th className="border border-pink-300 px-3 py-2.5 font-medium dark:border-pink-900/60">ชื่อ</th>
              <th className="w-28 border border-pink-300 px-2 py-2.5 font-medium dark:border-pink-900/60">วดป เกิด</th>
              <th className="border border-pink-300 px-3 py-2.5 font-medium dark:border-pink-900/60">ตำแหน่ง</th>
              <th className="w-16 border border-pink-300 px-2 py-2.5 text-center font-medium dark:border-pink-900/60">ลำดับ</th>
              <th className="border border-pink-300 px-3 py-2.5 font-medium dark:border-pink-900/60">สถานศึกษา</th>
              <th className="w-16 border border-pink-300 px-2 py-2.5 text-center font-medium dark:border-pink-900/60">รูปภาพ</th>
              <th className="w-14 border border-pink-300 px-2 py-2.5 text-center font-medium dark:border-pink-900/60">ลบ</th>
              <th className="w-14 border border-pink-300 px-2 py-2.5 text-center font-medium dark:border-pink-900/60">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="border border-pink-300 px-3 py-8 text-center text-muted-foreground dark:border-pink-900/60"
                >
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const rowNum = pageOffset + index + 1;
                const isChecked = selectedIds.includes(row.id);

                return (
                  <tr
                    key={row.id}
                    className={
                      index % 2 === 0
                        ? "bg-amber-50/30 hover:bg-amber-100/40 dark:bg-amber-950/10 dark:hover:bg-amber-900/20"
                        : "bg-white hover:bg-amber-50/50 dark:bg-card dark:hover:bg-amber-950/20"
                    }
                  >
                    <td className="border border-pink-200 px-2 py-2 text-center dark:border-pink-950/40">
                      <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(row.id)}
                          className="size-3.5 rounded border-muted-foreground/40 text-primary accent-primary"
                        />
                        <span className="font-mono text-xs text-muted-foreground">
                          {rowNum}
                        </span>
                      </label>
                    </td>
                    <td className="border border-pink-200 px-3 py-2 font-mono text-xs font-medium text-slate-800 dark:border-pink-950/40 dark:text-slate-200">
                      {row.personId}
                    </td>
                    <td className="border border-pink-200 px-3 py-2 text-slate-900 dark:border-pink-950/40 dark:text-slate-100">
                      {row.displayName}
                    </td>
                    <td className="border border-pink-200 px-2 py-2 text-xs text-slate-700 dark:border-pink-950/40 dark:text-slate-300">
                      {formatThaiShortDate(row.birthDate)}
                    </td>
                    <td className="border border-pink-200 px-3 py-2 text-slate-800 dark:border-pink-950/40 dark:text-slate-200">
                      {row.positionLabel}
                    </td>
                    <td className="border border-pink-200 px-2 py-2 text-center text-xs text-muted-foreground dark:border-pink-950/40">
                      {row.personOrder || ""}
                    </td>
                    <td className="border border-pink-200 px-3 py-2 text-slate-700 dark:border-pink-950/40 dark:text-slate-300">
                      {row.schoolName ?? "—"}
                    </td>
                    <td className="border border-pink-200 px-2 py-2 text-center dark:border-pink-950/40">
                      {row.pictureUrl ? (
                        <ImageIcon className="mx-auto size-4 text-blue-600 dark:text-blue-400" />
                      ) : index % 3 === 0 ? (
                        <Users className="mx-auto size-4 text-slate-500 dark:text-slate-400" />
                      ) : null}
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

      {/* Legacy bottom control bar */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-pink-200 bg-pink-50/50 p-2.5 dark:border-pink-950/40 dark:bg-pink-950/20">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="size-4 rounded border-muted-foreground/40 text-primary accent-primary"
            />
            เลือก/ไม่เลือกทั้งหมด
          </label>

          {canDelete ? (
            <Button
              variant="outline"
              size="sm"
              disabled={selectedIds.length === 0}
              className="h-8 text-xs border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              onClick={() => {
                if (
                  confirm(
                    `ยืนยันต้องการลบ/ปิดใช้งานรายการที่เลือก ${selectedIds.length} รายการ?`,
                  )
                ) {
                  // batch action
                }
              }}
            >
              ลบทั้งหมดที่เลือก
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            เพิ่มข้อมูลรูปภาพทั้งหมด
          </Button>
          <span className="text-muted-foreground">
            *กรณีที่มีไฟล์รูปภาพอยู่ในระบบแล้ว
          </span>
        </div>
      </div>
    </div>
  );
}
