"use client";

import { deleteLeaveYear } from "@/lib/leave/actions";

type LeaveYearDeleteButtonProps = {
  id: number;
};

export function LeaveYearDeleteButton({ id }: LeaveYearDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบปีงบประมาณนี้?")) return;
    await deleteLeaveYear(id);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-destructive hover:underline"
      aria-label="ลบ"
    >
      ลบ
    </button>
  );
}
