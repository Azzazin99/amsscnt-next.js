"use client";

import { deleteNewsMainitem } from "@/lib/news/actions";

type NewsMainitemDeleteButtonProps = {
  id: number;
};

export function NewsMainitemDeleteButton({ id }: NewsMainitemDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบชื่อเรื่องรายการนี้?")) return;
    await deleteNewsMainitem(id);
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
