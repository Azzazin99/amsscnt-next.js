"use client";

import { deletePersonModulePermission } from "@/lib/person/permissions/actions";

type PersonPermissionDeleteButtonProps = {
  id: number;
};

export function PersonPermissionDeleteButton({
  id,
}: PersonPermissionDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบสิทธิ์รายการนี้?")) return;
    await deletePersonModulePermission(id);
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
