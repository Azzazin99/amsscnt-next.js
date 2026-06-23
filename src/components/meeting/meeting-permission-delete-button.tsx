"use client";

import { deleteMeetingPermission } from "@/lib/meeting/actions";

type MeetingPermissionDeleteButtonProps = {
  id: number;
};

export function MeetingPermissionDeleteButton({
  id,
}: MeetingPermissionDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบสิทธิ์รายการนี้?")) return;
    await deleteMeetingPermission(id);
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
