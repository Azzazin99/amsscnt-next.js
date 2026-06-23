"use client";

import { Check } from "lucide-react";
import { toggleStudentEdYearActive } from "@/lib/student-main/actions";

export function StudentEdYearActiveToggle({ id, active }: { id: number; active: boolean }) {
  async function handleClick() {
    await toggleStudentEdYearActive(id);
  }

  return (
    <button type="button" onClick={handleClick} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted" aria-label={active ? "ปีปัจจุบัน" : "ตั้งเป็นปีปัจจุบัน"}>
      {active ? <Check className="size-5 text-green-600" /> : <span className="text-xs text-muted-foreground">ตั้ง</span>}
    </button>
  );
}
