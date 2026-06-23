"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type YearFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  defaultValues?: {
    year: number;
    yearActive: boolean;
    startReceiveNum: number;
    startSendNum: number;
    startCommandNum: number;
    startCertificateNum: number;
  };
  title: string;
  cancelHref: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function YearForm({
  action,
  defaultValues,
  title,
  cancelHref,
}: YearFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await action(formData);
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      <div className="space-y-2">
        <label htmlFor="year" className="text-sm font-medium">
          ปีปฏิทิน (พ.ศ.)
        </label>
        <input
          id="year"
          name="year"
          type="number"
          required
          min={2500}
          max={2700}
          defaultValue={defaultValues?.year ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["startReceiveNum", "เลขทะเบียนรับเริ่มต้น"],
            ["startSendNum", "เลขทะเบียนส่งเริ่มต้น"],
            ["startCommandNum", "เลขทะเบียนคำสั่งเริ่มต้น"],
            ["startCertificateNum", "เลขทะเบียนเกียรติบัตรเริ่มต้น"],
          ] as const
        ).map(([name, label]) => (
          <div key={name} className="space-y-2">
            <label htmlFor={name} className="text-sm font-medium">
              {label}
            </label>
            <input
              id={name}
              name={name}
              type="number"
              required
              min={0}
              max={99999}
              defaultValue={defaultValues?.[name] ?? 1}
              className={inputClass}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor="yearActive" className="text-sm font-medium">
          ปีทะเบียนปัจจุบัน
        </label>
        <select
          id="yearActive"
          name="yearActive"
          required
          defaultValue={
            defaultValues ? String(defaultValues.yearActive) : ""
          }
          className={inputClass}
        >
          <option value="">เลือก</option>
          <option value="true">ใช่</option>
          <option value="false">ไม่ใช่</option>
        </select>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "กำลังบันทึก..." : "ตกลง"}
        </Button>
        <Link
          href={cancelHref}
          className={cn(
            "inline-flex h-8 items-center justify-center rounded-lg border border-border px-2.5 text-sm hover:bg-muted",
          )}
        >
          ย้อนกลับ
        </Link>
      </div>
    </form>
  );
}
