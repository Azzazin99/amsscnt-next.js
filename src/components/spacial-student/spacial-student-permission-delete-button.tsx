"use client";

import { deleteSpacialStudentPermission } from "@/lib/spacial-student/actions";

export function SpacialStudentPermissionDeleteButton({ id }: { id: number }) {
  async function handleClick() {
    if (!confirm("ลบสิทธิ์รายการนี้?")) return;
    await deleteSpacialStudentPermission(id);
  }

  return (
    <button type="button" onClick={handleClick} className="text-destructive hover:underline" aria-label="ลบ">ลบ</button>
  );
}
