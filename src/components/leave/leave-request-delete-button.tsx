"use client";

import { Trash2 } from "lucide-react";
import { deleteLeaveRequest } from "@/lib/leave/actions";

type LeaveRequestDeleteButtonProps = {
  id: number;
};

export function LeaveRequestDeleteButton({ id }: LeaveRequestDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบคำขอลานี้?")) return;
    await deleteLeaveRequest(id);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10"
      aria-label="ลบคำขอลา"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  );
}
