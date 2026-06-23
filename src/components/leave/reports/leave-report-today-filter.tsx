"use client";

import { useRouter } from "next/navigation";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";

type LeaveReportTodayFilterProps = {
  defaultDate: string;
  basePath: string;
};

export function LeaveReportTodayFilter({
  defaultDate,
  basePath,
}: LeaveReportTodayFilterProps) {
  const router = useRouter();

  return (
    <form
      className="no-print mb-4 rounded-xl border bg-card p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const date = String(data.get("date") ?? defaultDate);
        if (!date) return;
        router.push(`${basePath}?date=${date}`);
      }}
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[14rem]">
          <ThaiDatePicker
            name="date"
            id="report-date"
            defaultValue={defaultDate}
            onChange={(iso) => {
              router.push(`${basePath}?date=${iso}`);
            }}
          />
        </div>
      </div>
    </form>
  );
}
