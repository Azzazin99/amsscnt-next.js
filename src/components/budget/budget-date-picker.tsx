"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function BudgetDatePicker({ selectedDate }: { selectedDate: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground/80 font-medium">
      <span>เลือกวันที่</span>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => {
          const val = e.target.value;
          if (val) {
            const params = new URLSearchParams(searchParams.toString());
            params.set("date", val);
            router.push(`?${params.toString()}`);
          }
        }}
        className="h-9 px-3 rounded-md border border-input bg-background text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs cursor-pointer"
      />
    </div>
  );
}
