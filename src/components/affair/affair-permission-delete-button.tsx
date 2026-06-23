"use client";

import { deleteAffairPermission } from "@/lib/affair/actions";

type AffairPermissionDeleteButtonProps = {
  id: number;
};

export function AffairPermissionDeleteButton({
  id,
}: AffairPermissionDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบสิทธิ์รายการนี้?")) return;
    await deleteAffairPermission(id);
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
