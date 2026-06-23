"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import type { RegisterReportKind } from "@/lib/bookregister/reports/columns";
import { cn } from "@/lib/utils";

type RegisterReportToolbarProps = {
  kind: RegisterReportKind;
  year: number;
  rowCount: number;
};

export function RegisterReportToolbar({
  kind,
  year,
  rowCount,
}: RegisterReportToolbarProps) {
  const router = useRouter();
  const exportHref = `/api/bookregister/reports/${kind}?year=${year}&format=xls`;

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
      <a
        href={exportHref}
        className={cn(
          buttonVariants({ variant: "outline" }),
          rowCount === 0 && "pointer-events-none opacity-50",
        )}
        aria-disabled={rowCount === 0}
      >
        ส่งออก Excel
      </a>
      <Link
        href="/modules/bookregister/reports"
        className={cn(buttonVariants({ variant: "ghost" }))}
      >
        เลือกรายงานอื่น
      </Link>
      <button
        type="button"
        className={cn(buttonVariants({ variant: "ghost" }))}
        onClick={() => router.back()}
      >
        กลับ
      </button>
      <p className="ml-auto text-sm text-muted-foreground">
        {rowCount > 0
          ? `${rowCount} รายการ — ปี ${year}`
          : `ไม่มีข้อมูลในปี ${year}`}
      </p>
    </div>
  );
}
