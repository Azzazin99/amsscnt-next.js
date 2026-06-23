"use client";

import { deleteStudentEdYear } from "@/lib/student-main/actions";

export function StudentEdYearDeleteButton({ id }: { id: number }) {
  async function handleClick() {
    if (!confirm("ลบปีการศึกษานี้?")) return;
    await deleteStudentEdYear(id);
  }

  return (
    <button type="button" onClick={handleClick} className="text-destructive hover:underline" aria-label="ลบ">ลบ</button>
  );
}
