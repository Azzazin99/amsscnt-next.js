"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Props = {
  q: string;
  ack: string;
  basePath: string;
  showAckFilter?: boolean;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function BookListFilters({
  q,
  ack,
  basePath,
  showAckFilter = basePath === "/modules/book/inbox" ||
    basePath === "/modules/book/inbox/aged",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(next: { q?: string; ack?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (next.q !== undefined) {
      if (next.q) params.set("q", next.q);
      else params.delete("q");
    }
    if (next.ack !== undefined && showAckFilter) {
      if (next.ack && next.ack !== "all") params.set("ack", next.ack);
      else params.delete("ack");
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${basePath}?${qs}` : basePath);
    });
  }

  const hasFilters = q || (showAckFilter && ack !== "all");

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        update({ q: (fd.get("q")?.toString() ?? "").trim() });
      }}
    >
      <div className="min-w-[12rem] flex-1 space-y-1">
        <label htmlFor="book-q" className="text-sm font-medium">
          ค้นหา
        </label>
        <input
          id="book-q"
          name="q"
          defaultValue={q}
          placeholder="เลขที่ / เรื่อง (≥2 ตัวอักษร)"
          className={inputClass}
        />
      </div>

      {showAckFilter ? (
        <div className="space-y-1">
          <label htmlFor="book-ack" className="text-sm font-medium">
            สถานะตอบรับ
          </label>
          <select
            id="book-ack"
            name="ack"
            defaultValue={ack}
            className={inputClass}
            onChange={(e) => update({ ack: e.target.value })}
          >
            <option value="all">ทั้งหมด</option>
            <option value="pending">รอตอบรับ</option>
            <option value="done">ตอบรับแล้ว</option>
          </select>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? "กำลังค้นหา..." : "ค้นหา"}
      </button>

      {hasFilters ? (
        <button
          type="button"
          className="inline-flex min-h-10 items-center rounded-lg border px-3 text-sm hover:bg-muted"
          onClick={() => router.push(basePath)}
        >
          ล้างตัวกรอง
        </button>
      ) : null}
    </form>
  );
}
