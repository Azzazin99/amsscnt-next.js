"use client";

import { useRouter } from "next/navigation";
import { LEAVE_TYPE_OPTIONS } from "@/lib/leave/constants";
import { buildLeaveRequestsUrl } from "@/lib/leave/list-url";

type LeaveListFiltersProps = {
  q: string;
  leaveType: number | null;
  grant: string;
};

const inputClass =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function LeaveListFilters({ q, leaveType, grant }: LeaveListFiltersProps) {
  const router = useRouter();

  function apply(form: HTMLFormElement) {
    const data = new FormData(form);
    const nextQ = String(data.get("q") ?? "").trim();
    const nextTypeRaw = String(data.get("leaveType") ?? "");
    const nextType = nextTypeRaw ? Number(nextTypeRaw) : null;
    const nextGrant = String(data.get("grant") ?? "all");
    router.push(
      buildLeaveRequestsUrl({
        q: nextQ,
        leaveType: nextType,
        grant: nextGrant,
      }),
    );
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
        <label htmlFor="la-q" className="text-xs font-medium text-muted-foreground">
          ค้นหา (ชื่อ / เลขบัตร)
        </label>
        <input
          id="la-q"
          name="q"
          defaultValue={q}
          placeholder="อย่างน้อย 2 ตัวอักษร"
          className={inputClass + " w-full"}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="leaveType" className="text-xs font-medium text-muted-foreground">
          ประเภท
        </label>
        <select
          id="leaveType"
          name="leaveType"
          defaultValue={leaveType ? String(leaveType) : ""}
          className={inputClass}
        >
          <option value="">ทั้งหมด</option>
          {LEAVE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="grant" className="text-xs font-medium text-muted-foreground">
          สถานะ
        </label>
        <select
          id="grant"
          name="grant"
          defaultValue={grant}
          className={inputClass}
        >
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
