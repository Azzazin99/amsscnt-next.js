"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PermissionReportToolbarProps = {
  rowCount: number;
  subtitle?: string;
};

export function PermissionReportToolbar({
  rowCount,
  subtitle,
}: PermissionReportToolbarProps) {
  const router = useRouter();

  return (
    <div className="no-print mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-4 shadow-sm">
      <button
        type="button"
        className={cn(buttonVariants())}
        onClick={() => window.print()}
        disabled={rowCount === 0}
      >
        พิมพ์ / บันทึก PDF
      </button>
      <button
        type="button"
        className={cn(buttonVariants({ variant: "ghost" }))}
        onClick={() => router.back()}
      >
        กลับ
      </button>
      <p className="ml-auto text-sm text-muted-foreground">
        {rowCount > 0
          ? `${rowCount} รายการ${subtitle ? ` — ${subtitle}` : ""}`
          : `ไม่มีข้อมูล${subtitle ? ` — ${subtitle}` : ""}`}
      </p>
    </div>
  );
}
