"use client";

import { Trash2 } from "lucide-react";
import { removeSchoolSarabanPermission } from "@/lib/book/permissions/actions";

export function SchoolSarabanDeleteButton({ id }: { id: number }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
      title="ลบ"
      aria-label="ลบ"
      onClick={async () => {
        if (!confirm("ยืนยันถอนสิทธิ์สารบรรณสถานศึกษานี้?")) return;
        await removeSchoolSarabanPermission(id);
      }}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
