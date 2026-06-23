"use client";

import { deleteSpacialStudent } from "@/lib/spacial-student/actions";

export function SpacialStudentDeleteButton({ id }: { id: number }) {
  async function handleClick() {
    if (!confirm("ลบรายการนักเรียนพิเศษนี้?")) return;
    await deleteSpacialStudent(id);
  }

  return (
    <button type="button" onClick={handleClick} className="text-destructive hover:underline" aria-label="ลบ">ลบ</button>
  );
}
