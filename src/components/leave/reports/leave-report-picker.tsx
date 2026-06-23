"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  listVisibleLeaveReportOptions,
} from "@/lib/leave/report-nav";
import type { LeaveReportKind } from "@/lib/leave/reports/types";
import { cn } from "@/lib/utils";

type LeaveReportPickerProps = {
  years: number[];
  defaultYear: number | null;
  scopeKind: "district" | "school";
  isPrincipalViewer: boolean;
};

export function LeaveReportPicker({
  years,
  defaultYear,
  scopeKind,
  isPrincipalViewer,
}: LeaveReportPickerProps) {
  const router = useRouter();
  const navOpts = { scopeKind, isPrincipalViewer };
  const options = listVisibleLeaveReportOptions(navOpts);
  const defaultKind = options[0]?.kind ?? "today";

  return (
    <form
      className="rounded-xl border bg-card p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const kind = String(data.get("kind") ?? defaultKind) as LeaveReportKind;
        const option = options.find((o) => o.kind === kind);
        if (!option) return;

        const year = String(data.get("year") ?? "");
        const params = new URLSearchParams();
        if (option.needsYear && year) params.set("year", year);
        const qs = params.toString();
        router.push(qs ? `${option.href}?${qs}` : option.href);
      }}
    >
      <fieldset className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">รายงาน</span>
          <select
            name="kind"
            defaultValue={defaultKind}
            className="h-10 rounded-lg border border-input bg-background px-3"
          >
            {options.map((option) => (
              <option key={option.kind} value={option.kind}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {years.length > 0 ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">ปีงบประมาณ (พ.ศ.)</span>
            <select
              name="year"
              defaultValue={defaultYear ?? years[0] ?? ""}
              className="h-10 rounded-lg border border-input bg-background px-3"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              ใช้กับรายงานสถิติที่ต้องเลือกปี
            </span>
          </label>
        ) : null}
      </fieldset>

      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {options.map((option) => (
          <li key={option.kind}>
            <strong className="text-foreground">{option.label}:</strong>{" "}
            {option.description}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="submit" className={cn(buttonVariants())}>
          เปิดรายงาน
        </button>
        <Link
          href="/modules/leave/requests"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          กลับหน้าโมดูล
        </Link>
      </div>
    </form>
  );
}
