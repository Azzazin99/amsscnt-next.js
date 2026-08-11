"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { SPACIAL_DISABLE_TYPES } from "@/lib/spacial-student/constants";
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
    personId: string;
    schoolCode: string;
    disableType: number;
    disableDetail: string;
    other: string;
    status: number;
  };
  studentLabel?: string | null;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SpacialStudentForm({
  action,
  title,
  cancelHref,
  schools,
  mode,
  recordId,
  lockSchool = false,
  defaultValues,
  studentLabel,
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
      if (result && "ok" in result && !result.ok) setError(result.message ?? "บันทึกไม่สำเร็จ");
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>
      {studentLabel ? <p className="text-sm text-muted-foreground">นักเรียน: {studentLabel}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="personId" className="text-sm font-medium">เลขประจำตัวประชาชน</label>
          <input id="personId" name="personId" required maxLength={13} defaultValue={defaultValues.personId} className={inputClass} />
        </div>
        <div className="space-y-2">
          <label htmlFor="schoolCode" className="text-sm font-medium">โรงเรียน</label>
          <select id="schoolCode" name="schoolCode" required disabled={lockSchool} defaultValue={defaultValues.schoolCode} className={inputClass}>
            <option value="">— เลือก —</option>
            {schools.map((s) => (<option key={s.schoolCode} value={s.schoolCode}>{s.name}</option>))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="disableType" className="text-sm font-medium">ประเภทความพิการ/ความต้องการพิเศษ</label>
          <select id="disableType" name="disableType" required defaultValue={defaultValues.disableType || ""} className={inputClass}>
            <option value="">— เลือก —</option>
            {SPACIAL_DISABLE_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="disableDetail" className="text-sm font-medium">รายละเอียด</label>
          <textarea id="disableDetail" name="disableDetail" rows={3} defaultValue={defaultValues.disableDetail} className={cn(inputClass, "h-auto py-2")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="other" className="text-sm font-medium">หมายเหตุอื่น</label>
          <textarea id="other" name="other" rows={2} defaultValue={defaultValues.other} className={cn(inputClass, "h-auto py-2")} />
        </div>
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">สถานะ</label>
          <input id="status" name="status" type="number" min={0} max={9} defaultValue={defaultValues.status} className={inputClass} />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={loading} className="min-h-11 min-w-28 justify-center">{loading ? "กำลังบันทึก…" : "บันทึก"}</Button>
        <Link href={cancelHref} className={buttonVariants({ variant: "outline", className: "min-h-11 min-w-28 justify-center" })}>ยกเลิก</Link>
      </div>
    </form>
  );
}
