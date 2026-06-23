"use client";

import { deletePermissionYear } from "@/lib/permission/actions";

type PermissionYearDeleteButtonProps = {
  id: number;
};

export function PermissionYearDeleteButton({ id }: PermissionYearDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบปีงบประมาณนี้?")) return;
    await deletePermissionYear(id);
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
