"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  years: number[];
  selectedYear: number;
};

export function BudgetYearFilter({ years, selectedYear }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", newYear);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-end gap-2 text-xs sm:text-sm font-medium">
      <label htmlFor="budget-year-select" className="text-foreground/80 whitespace-nowrap">
        ปีงบประมาณ
      </label>
      <select
        id="budget-year-select"
        value={selectedYear}
        onChange={handleChange}
        className="h-8 px-2.5 py-1 text-xs sm:text-sm bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
