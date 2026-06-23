"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { togglePermissionYearActive } from "@/lib/permission/actions";

export function PermissionYearActiveToggle({
  id,
  active,
}: {
  id: number;
  active: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted disabled:opacity-50"
      title={
        active
          ? "ปีงบประมาณปัจจุบัน — คลิกเพื่อปิด"
          : "คลิกเพื่อตั้งเป็นปีปัจจุบัน"
      }
      aria-label={active ? "ปีงบประมาณปัจจุบัน" : "ไม่ใช่ปีปัจจุบัน"}
      onClick={() => {
        startTransition(async () => {
          await togglePermissionYearActive(id);
          router.refresh();
        });
      }}
    >
      {active ? (
        <Check className="size-5 text-green-600" />
      ) : (
        <X className="size-5 text-muted-foreground" />
      )}
    </button>
  );
}
