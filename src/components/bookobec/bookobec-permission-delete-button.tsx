"use client";

import { Trash2 } from "lucide-react";
import { deleteBookobecPermission } from "@/lib/bookobec/actions";

type BookobecPermissionDeleteButtonProps = {
  id: number;
};

export function BookobecPermissionDeleteButton({
  id,
}: BookobecPermissionDeleteButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
      title="ลบ"
      aria-label="ลบ"
      onClick={async () => {
        if (!confirm("ยืนยันลบเจ้าหน้าที่นี้?")) return;
        await deleteBookobecPermission(id);
      }}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
