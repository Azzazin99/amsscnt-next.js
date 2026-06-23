"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildNewsArticlesUrl } from "@/lib/news/list-url";
import type { NewsSectionRow } from "@/lib/news/queries";

type NewsListFiltersProps = {
  q: string;
  sectionCode: number;
  sections: NewsSectionRow[];
};

export function NewsListFilters({
  q,
  sectionCode,
  sections,
}: NewsListFiltersProps) {
  const router = useRouter();
  const [query, setQuery] = useState(q);
  const [section, setSection] = useState(String(sectionCode || ""));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(
      buildNewsArticlesUrl({
        q: query.trim() || undefined,
        section: section ? Number(section) : undefined,
      }),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="min-w-[160px] space-y-1">
        <label htmlFor="news-section" className="text-sm font-medium">
          ประเภท
        </label>
        <select
          id="news-section"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">ทั้งหมด</option>
          {sections.map((s) => (
            <option key={s.id} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[200px] flex-1 space-y-1">
        <label htmlFor="news-q" className="text-sm font-medium">
          ค้นหา
        </label>
        <input
          id="news-q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ข้อความข่าว"
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
