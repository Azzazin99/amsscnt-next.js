"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button } from "@/components/ui/button";
import { PERSON_PREFIX_OPTIONS, prefixSelectValue } from "@/lib/person/constants";
import { POSITION_OPTIONS } from "@/lib/person/position-labels";
import { cn } from "@/lib/utils";

type SchoolOption = { id: number; name: string; schoolCode: string };
type WorkgroupOption = { id: number; name: string };

type PersonFormProps = {
  action: (
    formData: FormData,
  ) => Promise<{ ok: boolean; message?: string; id?: number } | void>;
  title: string;
  cancelHref: string;
  mode: "create" | "edit";
  schools: SchoolOption[];
  workgroups: WorkgroupOption[];
  lockOrg?: boolean;
  defaultValues?: {
    personId?: string;
    prefix?: string | null;
    firstName?: string;
    lastName?: string;
    organizationType?: "district" | "school";
    schoolId?: number | null;
    workgroupId?: number | null;
    positionCode?: number;
    status?: number;
    multiSchool?: boolean;
    extraSchoolIds?: number[];
    serviceStartDate?: string | null;
  };
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function PersonForm({
  action,
  title,
  cancelHref,
  mode,
  schools,
  workgroups,
  lockOrg = false,
  defaultValues,
}: PersonFormProps) {
  const router = useRouter();
  const [orgType, setOrgType] = useState<"district" | "school">(
    defaultValues?.organizationType ?? "school",
  );
  const [multiSchool, setMultiSchool] = useState(
    defaultValues?.multiSchool ?? false,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await action(new FormData(e.currentTarget));
      if (result && "ok" in result && !result.ok) {
        setError(result.message ?? "บันทึกไม่สำเร็จ");
        return;
      }
      if (
        mode === "create" &&
        result &&
        "ok" in result &&
        result.ok &&
        "id" in result &&
        typeof result.id === "number"
      ) {
        router.push(`/modules/person/staff/${result.id}/edit`);
        router.refresh();
        return;
      }
      router.refresh();
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      <div className="space-y-2">
        <label htmlFor="personId" className="text-sm font-medium">
          เลขบัตรประชาชน (13 หลัก)
        </label>
        <input
          id="personId"
          name="personId"
          required
          maxLength={13}
          pattern="\d{13}"
          defaultValue={defaultValues?.personId ?? ""}
          className={cn(inputClass, "font-mono")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="prefix" className="text-sm font-medium">
            คำนำหน้า
          </label>
          <select
            id="prefix"
            name="prefix"
            required
            defaultValue={prefixSelectValue(defaultValues?.prefix)}
            className={inputClass}
          >
            <option value="">— เลือก —</option>
            {PERSON_PREFIX_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            ใช้กำหนดสิทธิ์ประเภทลาตามระเบียบ 2555 (เช่น ลาคลอดบุตร, ลาอุปสมบท)
          </p>
        </div>
        <div className="space-y-2 sm:col-span-1">
          <label htmlFor="firstName" className="text-sm font-medium">
            ชื่อ
          </label>
          <input
            id="firstName"
            name="firstName"
            required
            maxLength={100}
            defaultValue={defaultValues?.firstName ?? ""}
            className={inputClass}
          />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <label htmlFor="lastName" className="text-sm font-medium">
            นามสกุล
          </label>
          <input
            id="lastName"
            name="lastName"
            required
            maxLength={100}
            defaultValue={defaultValues?.lastName ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      {!lockOrg ? (
        <div className="space-y-2">
          <span className="text-sm font-medium">ระดับ</span>
          <div className="flex gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="organizationType"
                value="district"
                checked={orgType === "district"}
                onChange={() => setOrgType("district")}
              />
              เขต
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="organizationType"
                value="school"
                checked={orgType === "school"}
                onChange={() => setOrgType("school")}
              />
              โรงเรียน
            </label>
          </div>
        </div>
      ) : (
        <input
          type="hidden"
          name="organizationType"
          value={defaultValues?.organizationType ?? "school"}
        />
      )}

      {orgType === "school" || lockOrg ? (
        <div className="space-y-2">
          <label htmlFor="schoolId" className="text-sm font-medium">
            สถานศึกษา
          </label>
          <select
            id="schoolId"
            name="schoolId"
            required
            defaultValue={defaultValues?.schoolId ?? ""}
            disabled={lockOrg}
            className={inputClass}
          >
            <option value="">— เลือก —</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.schoolCode} {s.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor="workgroupId" className="text-sm font-medium">
            กลุ่มงาน
          </label>
          <select
            id="workgroupId"
            name="workgroupId"
            defaultValue={defaultValues?.workgroupId ?? ""}
            className={inputClass}
          >
            <option value="">— ไม่ระบุ —</option>
            {workgroups.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="positionCode" className="text-sm font-medium">
          ตำแหน่ง
        </label>
        <select
          id="positionCode"
          name="positionCode"
          defaultValue={defaultValues?.positionCode ?? 0}
          className={inputClass}
        >
          {POSITION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="serviceStartDate" className="text-sm font-medium">
          วันเริ่มราชการ
        </label>
        <ThaiDatePicker
          id="serviceStartDate"
          name="serviceStartDate"
          defaultValue={defaultValues?.serviceStartDate ?? undefined}
        />
        <p className="text-xs text-muted-foreground">
          ใช้คำนวณสิทธิ์ลาพักผ่อนตามระเบียบ 2555
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">
          สถานะ
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? 0}
          className={inputClass}
        >
          <option value={0}>ใช้งาน</option>
          <option value={1}>ปิด</option>
        </select>
      </div>

      {orgType === "school" ? (
        <div className="space-y-3 rounded-lg border p-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="multiSchool"
              checked={multiSchool}
              onChange={(e) => setMultiSchool(e.target.checked)}
            />
            สอนหลายโรงเรียน (multi-school)
          </label>
          {multiSchool ? (
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">
                เลือกโรงเรียนเพิ่มเติม (นอกจากโรงเรียนหลัก)
              </span>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded border p-2">
                {schools.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-start gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="extraSchoolIds"
                      value={s.id}
                      defaultChecked={defaultValues?.extraSchoolIds?.includes(
                        s.id,
                      )}
                    />
                    <span>
                      {s.schoolCode} {s.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={loading} className="min-h-11">
          {loading ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
        <Link
          href={cancelHref}
          className={cn(
            "inline-flex min-h-11 items-center rounded-lg border px-4 text-sm hover:bg-muted",
          )}
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
