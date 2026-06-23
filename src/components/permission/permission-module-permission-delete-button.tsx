"use client";

import { deletePermissionModulePermission } from "@/lib/permission/actions";

type PermissionModulePermissionDeleteButtonProps = {
  id: number;
};

export function PermissionModulePermissionDeleteButton({
  id,
}: PermissionModulePermissionDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบสิทธิ์รายการนี้?")) return;
    await deletePermissionModulePermission(id);
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
