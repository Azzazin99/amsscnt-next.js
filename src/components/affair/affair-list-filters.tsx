"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildAffairListUrl } from "@/lib/affair/list-url";

type AffairListFiltersProps = {
  q: string;
};

export function AffairListFilters({ q }: AffairListFiltersProps) {
  const router = useRouter();
  const [query, setQuery] = useState(q);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildAffairListUrl({ q: query.trim() || undefined }));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="min-w-[200px] flex-1 space-y-1">
        <label htmlFor="affair-q" className="text-sm font-medium">
          ค้นหา
        </label>
        <input
          id="affair-q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="เรื่อง / สถานที่ / หมายเหตุ"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
        />
      </div>
      <button
        type="submit"
        className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground"
      >
        ค้นหา
      </button>
    </form>
  );
}
