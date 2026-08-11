"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DistrictStaffOption, SchoolOption } from "@/lib/book/permissions/queries";

type SchoolSarabanFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  schools: SchoolOption[];
  isDistrictAdmin: boolean;
  initialSchoolId?: number;
  initialStaffOptions: DistrictStaffOption[];
  fetchStaffAction?: (schoolId: number) => Promise<DistrictStaffOption[]>;
  cancelHref: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SchoolSarabanForm({
  action,
  schools,
  isDistrictAdmin,
  initialSchoolId,
  initialStaffOptions,
  fetchStaffAction,
  cancelHref,
}: SchoolSarabanFormProps) {
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | "">(
    initialSchoolId ?? (schools[0]?.id ?? ""),
  );
  const [staffOptions, setStaffOptions] = useState<DistrictStaffOption[]>(initialStaffOptions);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSchoolChange(newSchoolId: number) {
    setSelectedSchoolId(newSchoolId);
    if (!fetchStaffAction) return;

    setLoadingStaff(true);
    try {
      const list = await fetchStaffAction(newSchoolId);
      setStaffOptions(list);
    } catch {
      setError("ไม่สามารถโหลดรายชื่อบุคลากรได้");
    } finally {
      setLoadingStaff(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await action(new FormData(e.currentTarget));
      if (result && "ok" in result && !result.ok) {
        setError(result.message ?? "บันทึกไม่สำเร็จ");
      }
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-semibold text-primary">กำหนดสารบรรณ สถานศึกษา</h2>
      <p className="text-sm text-muted-foreground">
        เลือกโรงเรียนและบุคลากรเพื่อมอบหมายสิทธิ์ สารบรรณสถานศึกษา (p3)
      </p>

      {isDistrictAdmin ? (
        <div className="space-y-2">
          <label htmlFor="schoolId" className="text-sm font-medium">
            เลือกโรงเรียน
          </label>
          <select
            id="schoolId"
            name="schoolId"
            value={selectedSchoolId}
            onChange={(e) => handleSchoolChange(Number(e.target.value))}
            className={inputClass}
            required
          >
            <option value="">เลือกโรงเรียน</option>
            {schools.map((sch) => (
              <option key={sch.id} value={sch.id}>
                {sch.name} ({sch.schoolCode})
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="userId" className="text-sm font-medium">
          เลือกบุคลากร
        </label>
        <select
          id="userId"
          name="userId"
          required
          disabled={loadingStaff || staffOptions.length === 0}
          className={inputClass}
        >
          <option value="">
            {loadingStaff
              ? "กำลังโหลดรายชื่อ..."
              : staffOptions.length === 0
              ? "ไม่มีบุคลากรที่สามารถเลือกได้"
              : "เลือกบุคลากร"}
          </option>
          {staffOptions.map((staff) => (
            <option key={staff.userId} value={staff.userId}>
              {staff.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={loading || staffOptions.length === 0} className="min-w-28">
          {loading ? "กำลังบันทึก..." : "ตกลง"}
        </Button>
        <Link
          href={cancelHref}
          className={cn(buttonVariants({ variant: "outline" }), "min-w-28")}
        >
          ย้อนกลับ
        </Link>
      </div>
    </form>
  );
}
