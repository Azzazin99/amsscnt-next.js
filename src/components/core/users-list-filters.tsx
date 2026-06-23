"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buildUsersListUrl } from "@/lib/core/users/list-url";

type Props = { q: string; status: string };

export function UsersListFilters({ q, status }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => {
      router.push(
        buildUsersListUrl({
          q: String(fd.get("q") ?? "").trim() || undefined,
          status: String(fd.get("status") ?? "all") === "all" ? undefined : String(fd.get("status")),
        }),
      );
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-[200px] flex-1 space-y-1.5">
        <label htmlFor="users-q" className="text-sm font-medium">ค้นหา</label>
        <input id="users-q" name="q" type="search" defaultValue={q} placeholder="username / ชื่อ / เลขบัตร" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
      </div>
      <div className="space-y-1.5 sm:w-40">
        <label htmlFor="users-status" className="text-sm font-medium">สถานะ</label>
        <select id="users-status" name="status" defaultValue={status} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
          <option value="all">ทั้งหมด</option>
          <option value="active">ใช้งาน</option>
          <option value="inactive">ปิด</option>
        </select>
      </div>
      <button type="submit" disabled={pending} className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
        {pending ? "กำลังค้นหา..." : "ค้นหา"}
      </button>
    </form>
  );
}
