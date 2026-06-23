"use client";

import { deletePlanYear } from "@/lib/plan/actions";

export function PlanYearDeleteButton({ id }: { id: number }) {
  async function handleClick() {
    if (!confirm("ลบปีงบประมาณนี้?")) return;
    await deletePlanYear(id);
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
