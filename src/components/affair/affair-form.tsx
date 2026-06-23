"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PersonOption } from "@/lib/affair/queries";

type AffairFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string; id?: number }>;
  people: PersonOption[];
  title: string;
  cancelHref: string;
  defaultValues?: {
    affairDate: string;
    affairTime: string;
    subject: string;
    location: string;
    operationPersonId: string;
    remark: string | null;
  };
  latestSubject?: string | null;
  latestLocation?: string | null;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function AffairForm({
  action,
  people,
  title,
  cancelHref,
  defaultValues,
  latestSubject,
  latestLocation,
}: AffairFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState(defaultValues?.subject ?? "");
  const [location, setLocation] = useState(defaultValues?.location ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await action(new FormData(e.currentTarget));
      if (!result.ok) {
        setError(result.message ?? "บันทึกไม่สำเร็จ");
        return;
      }
      router.push("/modules/affair");
      router.refresh();
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
          <label htmlFor="affairDate" className="text-sm font-medium">
            วันที่
          </label>
          <ThaiDatePicker
            id="affairDate"
            name="affairDate"
            defaultValue={defaultValues?.affairDate}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="affairTime" className="text-sm font-medium">
            เวลา
          </label>
          <input
            id="affairTime"
            name="affairTime"
            required
            maxLength={50}
            defaultValue={defaultValues?.affairTime}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="subject" className="text-sm font-medium">
            เรื่องภารกิจ
          </label>
          {latestSubject ? (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setSubject(latestSubject)}
            >
              เรียกข้อมูลล่าสุด
            </button>
          ) : null}
        </div>
        <input
          id="subject"
          name="subject"
          required
          maxLength={150}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="location" className="text-sm font-medium">
            สถานที่
          </label>
          {latestLocation ? (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setLocation(latestLocation)}
            >
              เรียกข้อมูลล่าสุด
            </button>
          ) : null}
        </div>
        <input
          id="location"
          name="location"
          required
          maxLength={150}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="operationPersonId" className="text-sm font-medium">
          ผู้ปฏิบัติ
        </label>
        <select
          id="operationPersonId"
          name="operationPersonId"
          required
          defaultValue={defaultValues?.operationPersonId ?? ""}
          className={inputClass}
        >
          <option value="">— เลือก —</option>
          {people.map((p) => (
            <option key={p.personId} value={p.personId}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="remark" className="text-sm font-medium">
          หมายเหตุ
        </label>
        <input
          id="remark"
          name="remark"
          maxLength={150}
          defaultValue={defaultValues?.remark ?? ""}
          className={inputClass}
        />
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
