"use client";

import { deleteSchoolGrantDeputy } from "@/lib/leave/actions";

type LeaveSchoolGrantDeleteButtonProps = {
  id: number;
};

export function LeaveSchoolGrantDeleteButton({
  id,
}: LeaveSchoolGrantDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบรายการนี้?")) return;
    await deleteSchoolGrantDeputy(id);
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
