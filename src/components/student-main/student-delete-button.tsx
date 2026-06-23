"use client";

import { deleteStudent } from "@/lib/student-main/actions";

export function StudentDeleteButton({ id }: { id: number }) {
  async function handleClick() {
    if (!confirm("ลบข้อมูลนักเรียนนี้?")) return;
    await deleteStudent(id);
  }

  return (
    <button type="button" onClick={handleClick} className="text-destructive hover:underline" aria-label="ลบ">
      ลบ
    </button>
  );
}
