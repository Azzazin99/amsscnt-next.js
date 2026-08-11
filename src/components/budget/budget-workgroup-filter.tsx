"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { SystemWorkgroupItem } from "@/lib/budget/report-queries";

type Props = {
  workgroups: SystemWorkgroupItem[];
  selectedWorkgroup?: number;
};

export function BudgetWorkgroupFilter({
  workgroups,
  selectedWorkgroup,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      value={selectedWorkgroup || ""}
      onChange={(e) => {
        const val = e.target.value;
        const params = new URLSearchParams(searchParams.toString());
        if (val) {
          params.set("workgroup", val);
        } else {
          params.delete("workgroup");
        }
        router.push(`?${params.toString()}`);
      }}
      className="h-9 px-3 text-xs sm:text-sm bg-background border border-input rounded-md shadow-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
    >
      <option value="">ทุกกลุ่ม(งาน)</option>
      {workgroups.map((wg) => (
        <option key={wg.workgroup} value={wg.workgroup}>
          {wg.workgroupDesc}
        </option>
      ))}
    </select>
  );
}
