"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buildPersonListUrl } from "@/lib/person/list-url";

type SchoolOption = { id: number; name: string; schoolCode: string };
type WorkgroupOption = { id: number; name: string };

type PersonListFiltersProps = {
  q: string;
  status: string;
  org: string;
  schoolId: number | null;
  workgroupId: number | null;
  showDistrictFilters: boolean;
  schools: SchoolOption[];
  workgroups: WorkgroupOption[];
};

export function PersonListFilters({
  q,
  status,
  org,
  schoolId,
  workgroupId,
  showDistrictFilters,
  schools,
  workgroups,
}: PersonListFiltersProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nextQ = String(formData.get("q") ?? "").trim();
    const nextStatus = String(formData.get("status") ?? "all");
    const nextOrg = String(formData.get("org") ?? "all");
    const nextSchoolId = Number(formData.get("schoolId") ?? "");
    const nextWorkgroupId = Number(formData.get("workgroupId") ?? "");

    startTransition(() => {
      router.push(
        buildPersonListUrl({
          q: nextQ || undefined,
          status: nextStatus === "all" ? undefined : nextStatus,
          org: nextOrg === "all" ? undefined : nextOrg,
          schoolId:
            Number.isFinite(nextSchoolId) && nextSchoolId > 0
              ? nextSchoolId
              : undefined,
          workgroupId:
            Number.isFinite(nextWorkgroupId) && nextWorkgroupId > 0
              ? nextWorkgroupId
              : undefined,
        }),
      );
    });
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end"
    >
      <div className="min-w-[200px] flex-1 space-y-1.5">
        <label htmlFor="person-q" className="text-sm font-medium">
          ค้นหา
        </label>
        <input
          id="person-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="เลขบัตร / ชื่อ / นามสกุล (≥2 ตัวอักษร)"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5 sm:w-36">
        <label htmlFor="person-status" className="text-sm font-medium">
          สถานะ
        </label>
        <select
          id="person-status"
          name="status"
          defaultValue={status}
          className={inputClass}
        >
          <option value="all">ทั้งหมด</option>
          <option value="active">ใช้งาน</option>
          <option value="inactive">ปิด</option>
        </select>
      </div>

      {showDistrictFilters ? (
        <>
          <div className="space-y-1.5 sm:w-36">
            <label htmlFor="person-org" className="text-sm font-medium">
              ระดับ
            </label>
            <select
              id="person-org"
              name="org"
              defaultValue={org}
              className={inputClass}
            >
              <option value="all">ทั้งหมด</option>
              <option value="district">เขต</option>
              <option value="school">โรงเรียน</option>
            </select>
          </div>

          <div className="min-w-[180px] flex-1 space-y-1.5">
            <label htmlFor="person-school" className="text-sm font-medium">
              สถานศึกษา
            </label>
            <select
              id="person-school"
              name="schoolId"
              defaultValue={schoolId ?? ""}
              className={inputClass}
            >
              <option value="">ทั้งหมด</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.schoolCode} {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[180px] flex-1 space-y-1.5">
            <label htmlFor="person-workgroup" className="text-sm font-medium">
              กลุ่มงาน
            </label>
            <select
              id="person-workgroup"
              name="workgroupId"
              defaultValue={workgroupId ?? ""}
              className={inputClass}
            >
              <option value="">ทั้งหมด</option>
              {workgroups.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 min-w-24 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? "กำลังค้นหา…" : "ค้นหา"}
      </button>
    </form>
  );
}
