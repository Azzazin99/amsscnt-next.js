"use client";

import { Trash2 } from "lucide-react";
import { deleteDistrictRegisterPermission } from "@/lib/bookregister/permissions/actions";

export function PermissionDeleteButton({ id }: { id: number }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
      title="ลบ"
      aria-label="ลบ"
      onClick={async () => {
        if (!confirm("ยืนยันลบเจ้าหน้าที่นี้?")) return;
        await deleteDistrictRegisterPermission(id);
      }}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
