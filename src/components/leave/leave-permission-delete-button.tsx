"use client";

import { deleteLeavePermission } from "@/lib/leave/actions";

type LeavePermissionDeleteButtonProps = {
  id: number;
};

export function LeavePermissionDeleteButton({ id }: LeavePermissionDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบสิทธิ์รายการนี้?")) return;
    await deleteLeavePermission(id);
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
