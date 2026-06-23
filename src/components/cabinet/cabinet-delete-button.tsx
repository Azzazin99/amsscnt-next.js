"use client";

import { deleteCabinetDocument } from "@/lib/cabinet/actions";

type CabinetDeleteButtonProps = {
  id: number;
};

export function CabinetDeleteButton({ id }: CabinetDeleteButtonProps) {
  async function handleClick() {
    if (!confirm("ลบเอกสารรายการนี้?")) return;
    await deleteCabinetDocument(id);
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
