"use client";

import { deleteNewsArticle } from "@/lib/news/actions";

type NewsDeleteButtonProps = {
  id: number;
};

export function NewsDeleteButton({ id }: NewsDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบข่าวรายการนี้?")) return;
    await deleteNewsArticle(id);
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
