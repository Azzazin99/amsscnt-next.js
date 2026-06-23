"use client";

import { deleteCabinetPermission } from "@/lib/cabinet/actions";

type CabinetPermissionDeleteButtonProps = {
  id: number;
};

export function CabinetPermissionDeleteButton({
  id,
}: CabinetPermissionDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบสิทธิ์รายการนี้?")) return;
    await deleteCabinetPermission(id);
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
