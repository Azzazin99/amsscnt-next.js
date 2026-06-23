"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  STUDENT_CLASS_LEVELS,
  STUDENT_SEX_OPTIONS,
} from "@/lib/student-main/constants";
import { cn } from "@/lib/utils";

type SchoolOption = { schoolCode: string; name: string };

type Props = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  title: string;
  cancelHref: string;
  schools: SchoolOption[];
  mode?: "create" | "edit";
  recordId?: number;
  lockSchool?: boolean;
  defaultValues: {
    edYear: number;
    schoolCode: string;
    studentId: string;
    personId: string;
    prename: string;
    name: string;
    surname: string;
    sex: string;
    classLevel: number;
    classroom: number;
  };
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function StudentForm({
  action,
  title,
  cancelHref,
  schools,
  mode,
  recordId,
  lockSchool = false,
  defaultValues,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const result = await action(fd);
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="edYear" className="text-sm font-medium">
            ปีการศึกษา (พ.ศ.)
          </label>
          <input
            id="edYear"
            name="edYear"
            type="number"
            required
            defaultValue={defaultValues.edYear}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="schoolCode" className="text-sm font-medium">
            โรงเรียน
          </label>
          <select
            id="schoolCode"
            name="schoolCode"
            required
            disabled={lockSchool}
            defaultValue={defaultValues.schoolCode}
            className={inputClass}
          >
            <option value="">— เลือก —</option>
            {schools.map((s) => (
              <option key={s.schoolCode} value={s.schoolCode}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="studentId" className="text-sm font-medium">
            เลขประจำตัวนักเรียน
          </label>
          <input
            id="studentId"
            name="studentId"
            required
            maxLength={15}
            defaultValue={defaultValues.studentId}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="personId" className="text-sm font-medium">
            เลขประจำตัวประชาชน
          </label>
          <input
            id="personId"
            name="personId"
            required
            maxLength={13}
            defaultValue={defaultValues.personId}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="prename" className="text-sm font-medium">
            คำนำหน้า
          </label>
          <input
            id="prename"
            name="prename"
            required
            defaultValue={defaultValues.prename}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="sex" className="text-sm font-medium">
            เพศ
          </label>
          <select
            id="sex"
            name="sex"
            required
            defaultValue={defaultValues.sex}
            className={inputClass}
          >
            <option value="">— เลือก —</option>
            {STUDENT_SEX_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="name" className="text-sm font-medium">
            ชื่อ
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={defaultValues.name}
            className={inputClass}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="surname" className="text-sm font-medium">
            นามสกุล
          </label>
          <input
            id="surname"
            name="surname"
            required
            defaultValue={defaultValues.surname}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="classLevel" className="text-sm font-medium">
            ชั้น
          </label>
          <select
            id="classLevel"
            name="classLevel"
            required
            defaultValue={defaultValues.classLevel}
            className={inputClass}
          >
            <option value="">— เลือก —</option>
            {STUDENT_CLASS_LEVELS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="classroom" className="text-sm font-medium">
            ห้อง
          </label>
          <input
            id="classroom"
            name="classroom"
            type="number"
            min={1}
            required
            defaultValue={defaultValues.classroom}
            className={inputClass}
          />
        </div>
      </div>

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
