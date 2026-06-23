"use client";

import { deleteNewsSection } from "@/lib/news/actions";

type NewsSectionDeleteButtonProps = {
  id: number;
};

export function NewsSectionDeleteButton({ id }: NewsSectionDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบประเภทรายการนี้?")) return;
    await deleteNewsSection(id);
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
