"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buildSchoolGroupsListUrl } from "@/lib/core/school-groups/list-url";

type SchoolGroupsListFiltersProps = {
  q: string;
};

export function SchoolGroupsListFilters({ q }: SchoolGroupsListFiltersProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nextQ = String(formData.get("q") ?? "").trim();

    startTransition(() => {
      router.push(buildSchoolGroupsListUrl({ q: nextQ || undefined }));
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="min-w-[200px] flex-1 space-y-1.5">
        <label htmlFor="school-groups-q" className="text-sm font-medium">
          ค้นหา
        </label>
        <input
          id="school-groups-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="ชื่อกลุ่ม (อย่างน้อย 2 ตัวอักษร)"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? "กำลังค้นหา..." : "ค้นหา"}
      </button>
    </form>
  );
}
