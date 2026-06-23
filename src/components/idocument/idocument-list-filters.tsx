"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildIdocumentListUrl } from "@/lib/idocument/list-url";

type IdocumentListFiltersProps = {
  basePath: string;
  q: string;
  placeholder?: string;
};

export function IdocumentListFilters({
  basePath,
  q,
  placeholder = "เลขที่ / เรื่อง / กลุ่มงาน / ผู้บันทึก",
}: IdocumentListFiltersProps) {
  const router = useRouter();
  const [query, setQuery] = useState(q);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(
      buildIdocumentListUrl(basePath, { q: query.trim() || undefined }),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="min-w-[200px] flex-1 space-y-1">
        <label htmlFor="idocument-q" className="text-sm font-medium">
          ค้นหา
        </label>
        <input
          id="idocument-q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
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
