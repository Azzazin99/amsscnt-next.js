"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type PlanListFiltersProps = {
  q: string;
  proj?: string;
  basePath: string;
  showProjectFilter?: boolean;
  projectOptions?: { codeProj: string; nameProj: string }[];
};

export function PlanListFilters({
  q,
  proj = "",
  basePath,
  showProjectFilter = false,
  projectOptions = [],
}: PlanListFiltersProps) {
  const router = useRouter();
  const [query, setQuery] = useState(q);
  const [project, setProject] = useState(proj);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (showProjectFilter && project) params.set("proj", project);
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
          placeholder="รหัส / ชื่อ"
          className={inputClass}
        />
      </div>

      {showProjectFilter ? (
        <div className="min-w-[200px] space-y-1">
          <label htmlFor="proj" className="text-xs font-medium">
            โครงการ
          </label>
          <select
            id="proj"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className={inputClass}
          >
            <option value="">ทั้งหมด</option>
            {projectOptions.map((p) => (
              <option key={p.codeProj} value={p.codeProj}>
                {p.codeProj} {p.nameProj}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <Button type="submit" className="min-h-11">
        ค้นหา
      </Button>
    </form>
  );
}
