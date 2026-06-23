"use client";

import { deleteAchievementPermission } from "@/lib/achievement/actions";

export function AchievementPermissionDeleteButton({ id }: { id: number }) {
  async function handleClick() {
    if (!confirm("ลบสิทธิ์รายการนี้?")) return;
    await deleteAchievementPermission(id);
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
