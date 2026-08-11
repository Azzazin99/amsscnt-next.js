"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type YearOption = { budgetYear: number; yearActive: boolean };
type WorkgroupOption = { legacyCode: number; name: string };
type StrategyOption = { idTegic: string; strategic: string };

type PlanReportFiltersProps = {
  basePath: string;
  years: YearOption[];
  selectedYear: number;
  workgroups?: WorkgroupOption[];
  selectedWorkgroup?: number | null;
  strategies?: StrategyOption[];
  selectedStrategy?: string | null;
  filterMode: "workgroup" | "strategy" | "year";
};

export function PlanReportFilters({
  basePath,
  years,
  selectedYear,
  workgroups = [],
  selectedWorkgroup = null,
  strategies = [],
  selectedStrategy = null,
  filterMode,
}: PlanReportFiltersProps) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const year = String(fd.get("year") ?? "");
    if (year) params.set("year", year);
    if (filterMode === "workgroup") {
      const wg = String(fd.get("workgroup") ?? "");
      if (wg) params.set("workgroup", wg);
    }
    if (filterMode === "strategy") {
      const st = String(fd.get("strategy") ?? "");
      if (st) params.set("strategy", st);
    }
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-4"
    >
      <div className="min-w-[140px] space-y-1">
        <label htmlFor="year" className="text-xs font-medium">
          ปีงบประมาณ
        </label>
        <select
          id="year"
          name="year"
          defaultValue={String(selectedYear)}
          className={inputClass}
        >
          {years.map((y) => (
            <option key={y.budgetYear} value={y.budgetYear}>
              {y.budgetYear}
              {y.yearActive ? " (ปีปัจจุบัน)" : ""}
            </option>
          ))}
        </select>
      </div>

      {filterMode === "workgroup" ? (
        <div className="min-w-[200px] flex-1 space-y-1">
          <label htmlFor="workgroup" className="text-xs font-medium">
            กลุ่ม(งาน)
          </label>
          <select
            id="workgroup"
            name="workgroup"
            defaultValue={selectedWorkgroup != null ? String(selectedWorkgroup) : ""}
            className={inputClass}
          >
            <option value="">ทุกกลุ่ม(งาน)</option>
            {workgroups.map((wg) => (
              <option key={wg.legacyCode} value={wg.legacyCode}>
                {wg.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {filterMode === "strategy" ? (
        <div className="min-w-[240px] flex-1 space-y-1">
          <label htmlFor="strategy" className="text-xs font-medium">
            กลยุทธ์
          </label>
          <select
            id="strategy"
            name="strategy"
            defaultValue={selectedStrategy ?? ""}
            className={inputClass}
          >
            <option value="">ทุกกลยุทธ์</option>
            {strategies.map((s) => (
              <option key={s.idTegic} value={s.idTegic}>
                {s.strategic.slice(0, 80)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <Button type="submit" className="min-h-11">
        เลือก
      </Button>
    </form>
  );
}
