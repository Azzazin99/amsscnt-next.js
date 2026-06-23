"use client";

import { useRouter } from "next/navigation";
import type { LeaveReportPeriod } from "@/lib/leave/reports/types";
import { cn } from "@/lib/utils";

type LeaveReportYearFilterProps = {
  years: number[];
  year: number;
  period?: LeaveReportPeriod;
  showPeriod?: boolean;
  basePath: string;
};

const PERIOD_OPTIONS: { value: LeaveReportPeriod; label: string }[] = [
  { value: "full", label: "12 เดือน (ต.ค.–ก.ย.)" },
  { value: "first-half", label: "6 เดือนแรก (ต.ค.–มี.ค.)" },
  { value: "second-half", label: "6 เดือนหลัง (เม.ย.–ก.ย.)" },
];

export function LeaveReportYearFilter({
  years,
  year,
  period = "full",
  showPeriod = false,
  basePath,
}: LeaveReportYearFilterProps) {
  const router = useRouter();

  return (
    <form
      className="no-print mb-4 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        params.set("year", String(data.get("year") ?? year));
        if (showPeriod) {
          params.set("period", String(data.get("period") ?? period));
        }
        router.push(`${basePath}?${params.toString()}`);
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">ปีงบประมาณ</span>
        <select
          name="year"
          defaultValue={year}
          className="h-10 min-w-[10rem] rounded-lg border border-input bg-background px-3"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>

      {showPeriod ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">รอบ</span>
          <select
            name="period"
            defaultValue={period}
            className="h-10 min-w-[12rem] rounded-lg border border-input bg-background px-3"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <button
        type="submit"
        className={cn(
          "h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90",
        )}
      >
        แสดงรายงาน
      </button>
    </form>
  );
}
