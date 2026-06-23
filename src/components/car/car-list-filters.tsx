"use client";

import { useRouter } from "next/navigation";
import { buildCarRequestsUrl } from "@/lib/car/list-url";

type CarListFiltersProps = {
  q: string;
  grant: string;
};

const inputClass =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CarListFilters({ q, grant }: CarListFiltersProps) {
  const router = useRouter();

  function apply(form: HTMLFormElement) {
    const data = new FormData(form);
    const nextQ = String(data.get("q") ?? "").trim();
    const nextGrant = String(data.get("grant") ?? "all");
    router.push(buildCarRequestsUrl({ q: nextQ, grant: nextGrant }));
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
    >
      <div className="min-w-[200px] flex-1 space-y-1">
        <label htmlFor="car-q" className="text-xs font-medium text-muted-foreground">
          ค้นหา (ชื่อ / สถานที่)
        </label>
        <input
          id="car-q"
          name="q"
          defaultValue={q}
          placeholder="อย่างน้อย 2 ตัวอักษร"
          className={inputClass + " w-full"}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="grant" className="text-xs font-medium text-muted-foreground">
          สถานะ
        </label>
        <select id="grant" name="grant" defaultValue={grant} className={inputClass}>
          <option value="all">ทั้งหมด</option>
          <option value="pending">รอพิจารณา</option>
          <option value="approved">อนุมัติ</option>
          <option value="rejected">ไม่อนุมัติ</option>
        </select>
      </div>

      <button
        type="submit"
        className="inline-flex h-10 min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        กรอง
      </button>
    </form>
  );
}
