"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { saveLeaveCollectRow } from "@/lib/leave/actions";
import type { LeaveCollectRow } from "@/lib/leave/collection-queries";

type LeaveCollectionTableProps = {
  rows: LeaveCollectRow[];
  budgetYear: number;
};

const inputClass =
  "h-9 w-20 rounded-md border border-input bg-background px-2 text-sm text-right outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50";

export function LeaveCollectionTable({
  rows,
  budgetYear,
}: LeaveCollectionTableProps) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  async function handleSave(personId: string, form: HTMLFormElement) {
    setSavingId(personId);
    setMessages((prev) => {
      const next = { ...prev };
      delete next[personId];
      return next;
    });

    const formData = new FormData(form);
    formData.set("personId", personId);

    try {
      const result = await saveLeaveCollectRow(formData);
      if (!result.ok) {
        setMessages((prev) => ({
          ...prev,
          [personId]: result.message ?? "บันทึกไม่สำเร็จ",
        }));
      }
    } catch {
      setMessages((prev) => ({ ...prev, [personId]: "บันทึกไม่สำเร็จ" }));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        ปีงบประมาณ {budgetYear} — แก้ไขแล้วกดบันทึกทีละแถว
      </p>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ชื่อ</th>
              <th className="px-3 py-3 font-medium">ตำแหน่ง</th>
              <th className="px-3 py-3 font-medium text-right">
                ลาพักผ่อนสะสม
              </th>
              <th className="px-3 py-3 font-medium text-right">
                ลาพักผ่อนประจำปี
              </th>
              <th className="px-3 py-3 text-center font-medium">บันทึก</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.personId}
                className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
              >
                <td className="px-3 py-2.5">{index + 1}</td>
                <td className="px-3 py-2.5">{row.displayName}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {row.positionLabel}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <input
                    type="number"
                    name="collectDay"
                    form={`collect-${row.personId}`}
                    step="0.5"
                    min={0}
                    defaultValue={row.collectDay}
                    className={inputClass}
                    aria-label={`ลาพักผ่อนสะสม ${row.displayName}`}
                  />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <input
                    type="number"
                    name="thisYearDay"
                    form={`collect-${row.personId}`}
                    step="1"
                    min={0}
                    defaultValue={row.thisYearDay}
                    className={inputClass}
                    aria-label={`ลาพักผ่อนประจำปี ${row.displayName}`}
                  />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <form
                    id={`collect-${row.personId}`}
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleSave(row.personId, e.currentTarget);
                    }}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      disabled={savingId === row.personId}
                      className="min-h-9"
                    >
                      {savingId === row.personId ? "…" : "บันทึก"}
                    </Button>
                  </form>
                  {messages[row.personId] ? (
                    <p
                      className="mt-1 text-right text-xs text-destructive"
                      role="alert"
                    >
                      {messages[row.personId]}
                    </p>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
