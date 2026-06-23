"use client";

import { deleteNewsPermission } from "@/lib/news/actions";

type NewsPermissionDeleteButtonProps = {
  id: number;
};

export function NewsPermissionDeleteButton({
  id,
}: NewsPermissionDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบสิทธิ์รายการนี้?")) return;
    await deleteNewsPermission(id);
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
