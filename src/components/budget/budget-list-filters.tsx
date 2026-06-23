"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function BudgetListFilters({
  q,
  basePath,
}: {
  q: string;
  basePath: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(q);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-4"
    >
      <div className="min-w-[200px] flex-1 space-y-1">
        <label htmlFor="q" className="text-xs font-medium">
          ค้นหา
        </label>
        <input
          id="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ที่เอกสาร / รายการ"
          className={inputClass}
        />
      </div>
      <Button type="submit" className="min-h-11">
        ค้นหา
      </Button>
    </form>
  );
}
