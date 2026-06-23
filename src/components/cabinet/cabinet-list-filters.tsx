"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildCabinetListUrl } from "@/lib/cabinet/list-url";

type CabinetListFiltersProps = {
  q: string;
};

export function CabinetListFilters({ q }: CabinetListFiltersProps) {
  const router = useRouter();
  const [query, setQuery] = useState(q);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildCabinetListUrl({ q: query.trim() || undefined }));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="min-w-[200px] flex-1 space-y-1">
        <label htmlFor="cabinet-q" className="text-sm font-medium">
          ค้นหา
        </label>
        <input
          id="cabinet-q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ชื่อเรื่องเอกสาร"
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
