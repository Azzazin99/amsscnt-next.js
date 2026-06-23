"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  q: string;
  ack: string;
  basePath: string;
  showAckFilter?: boolean;
};

export function MailListFilters({
  q,
  ack,
  basePath,
  showAckFilter = false,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(q);
  const [ackFilter, setAckFilter] = useState(ack);

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    if (showAckFilter) {
      if (ackFilter !== "all") params.set("ack", ackFilter);
      else params.delete("ack");
    }
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        applyFilters();
      }}
    >
      <div className="min-w-[12rem] flex-1 space-y-1">
        <label htmlFor="mail-q" className="text-sm font-medium">
          ค้นหา
        </label>
        <input
          id="mail-q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="เรื่อง / ข้อความ"
          className={inputClass}
        />
      </div>

      {showAckFilter ? (
        <div className="space-y-1">
          <label htmlFor="mail-ack" className="text-sm font-medium">
            ตอบรับ
          </label>
          <select
            id="mail-ack"
            value={ackFilter}
            onChange={(e) => setAckFilter(e.target.value)}
            className={inputClass}
          >
            <option value="all">ทั้งหมด</option>
            <option value="pending">ยังไม่ตอบรับ</option>
            <option value="done">ตอบรับแล้ว</option>
          </select>
        </div>
      ) : null}

      <Button type="submit" className="min-h-10">
        ค้นหา
      </Button>
    </form>
  );
}
