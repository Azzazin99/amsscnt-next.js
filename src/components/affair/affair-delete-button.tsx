"use client";

import { deleteAffairEntry } from "@/lib/affair/actions";

type AffairDeleteButtonProps = {
  id: number;
};

export function AffairDeleteButton({ id }: AffairDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบภารกิจรายการนี้?")) return;
    await deleteAffairEntry(id);
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
