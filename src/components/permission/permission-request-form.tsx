"use client";

import Link from "next/link";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PermissionRequestFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  cancelHref: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function PermissionRequestForm({
  action,
  cancelHref,
}: PermissionRequestFormProps) {
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
      }
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-semibold text-primary">ขออนุญาตไปราชการ</h2>

      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium">
          เรื่อง / วัตถุประสงค์
        </label>
        <input
          id="subject"
          name="subject"
          required
          maxLength={150}
          className={inputClass}
          placeholder="เช่น ไปราชการติดต่องาน..."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="place" className="text-sm font-medium">
          สถานที่ไปราชการ
        </label>
        <input
          id="place"
          name="place"
          required
          maxLength={150}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="travelStart" className="text-sm font-medium">
            วันเริ่มไปราชการ
          </label>
          <ThaiDatePicker id="travelStart" name="travelStart" required />
        </div>
        <div className="space-y-2">
          <label htmlFor="travelFinish" className="text-sm font-medium">
            วันสิ้นสุด
          </label>
          <ThaiDatePicker id="travelFinish" name="travelFinish" required />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="vehicle" className="text-sm font-medium">
          พาหนะ (ถ้ามี)
        </label>
        <input id="vehicle" name="vehicle" maxLength={150} className={inputClass} />
      </div>

      <div className="space-y-2">
        <label htmlFor="document" className="text-sm font-medium">
          เอกสารแนบ (ชื่อ)
        </label>
        <input id="document" name="document" maxLength={150} className={inputClass} />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={loading} className="min-h-11">
          {loading ? "กำลังบันทึก…" : "บันทึกคำขอ"}
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
