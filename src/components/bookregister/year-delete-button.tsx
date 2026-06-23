"use client";

import { Trash2 } from "lucide-react";
import { deleteDistrictYear } from "@/lib/bookregister/years/actions";

export function YearDeleteButton({ id }: { id: number }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
      title="ลบ"
      aria-label="ลบ"
      onClick={async () => {
        if (!confirm("ยืนยันลบปีทะเบียนนี้?")) return;
        await deleteDistrictYear(id);
      }}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
