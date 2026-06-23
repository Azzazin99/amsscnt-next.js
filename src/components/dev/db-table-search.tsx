"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  defaultQ?: string;
};

export function DbTableSearch({ defaultQ = "" }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQ);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    router.push(
      trimmed
        ? `/admin/dev/database?q=${encodeURIComponent(trimmed)}`
        : "/admin/dev/database",
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">
        <span className="text-muted-foreground">ค้นหาชื่อตาราง</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="เช่น mail_main"
          className="min-h-11 rounded-md border border-input bg-background px-3 py-2"
        />
      </label>
      <button type="submit" className={cn(buttonVariants(), "min-h-11")}>
        ค้นหา
      </button>
    </form>
  );
}
