"use client";

import { deleteStudentPermission } from "@/lib/student-main/actions";

export function StudentPermissionDeleteButton({ id }: { id: number }) {
  async function handleClick() {
    if (!confirm("ลบสิทธิ์รายการนี้?")) return;
    await deleteStudentPermission(id);
  }

  return (
    <button type="button" onClick={handleClick} className="text-destructive hover:underline" aria-label="ลบ">
      ลบ
    </button>
  );
}
