"use client";

import { deleteBudgetYear } from "@/lib/budget/actions";

export function BudgetYearDeleteButton({ id }: { id: number }) {
  async function handleClick() {
    if (!confirm("ลบปีงบประมาณนี้?")) return;
    await deleteBudgetYear(id);
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
