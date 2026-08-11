"use client";

import Link from "next/link";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button } from "@/components/ui/button";
import { bangkokTodayIso } from "@/lib/book/dates";
import {
  STANDARD_ATTACHMENT_ACCEPT,
  STANDARD_ATTACHMENT_TYPES_LABEL,
  validateStandardAttachmentFile,
} from "@/lib/form/attachment-allowed-types";
import { PERMISSION_VEHICLE_OPTIONS } from "@/lib/permission/constants";
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
  const [vehicleKind, setVehicleKind] = useState("");
  const todayIso = bangkokTodayIso();

  const needsDetail =
    vehicleKind === "private" || vehicleKind === "other";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const attachmentInput = form.elements.namedItem(
      "attachment",
    ) as HTMLInputElement | null;
    const file = attachmentInput?.files?.[0];
    if (file && file.size > 0) {
      const fileErr = validateStandardAttachmentFile(file);
      if (fileErr) {
        setError(fileErr);
        return;
      }
    }

    setLoading(true);
    try {
      const result = await action(new FormData(form));
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
          <ThaiDatePicker
            id="travelStart"
            name="travelStart"
            minIso={todayIso}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="travelFinish" className="text-sm font-medium">
            วันสิ้นสุด
          </label>
          <ThaiDatePicker
            id="travelFinish"
            name="travelFinish"
            minIso={todayIso}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="vehicleKind" className="text-sm font-medium">
          พาหนะ (ถ้ามี)
        </label>
        <select
          id="vehicleKind"
          name="vehicleKind"
          value={vehicleKind}
          onChange={(e) => setVehicleKind(e.target.value)}
          className={inputClass}
        >
          <option value="">— ไม่ระบุ —</option>
          {PERMISSION_VEHICLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {needsDetail ? (
        <div className="space-y-2">
          <label htmlFor="vehicleDetail" className="text-sm font-medium">
            {vehicleKind === "private" ? "หมายเลขทะเบียน" : "ระบุพาหนะ"}
          </label>
          <input
            id="vehicleDetail"
            name="vehicleDetail"
            required
            maxLength={100}
            className={inputClass}
            placeholder={
              vehicleKind === "private"
                ? "เช่น กข 1234 ชัยนาท"
                : "ระบุพาหนะที่ใช้"
            }
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="attachment" className="text-sm font-medium">
          เอกสารแนบ (ถ้ามี)
        </label>
        <input
          id="attachment"
          name="attachment"
          type="file"
          accept={STANDARD_ATTACHMENT_ACCEPT}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm"
        />
        <p className="text-xs text-muted-foreground">
          รองรับ {STANDARD_ATTACHMENT_TYPES_LABEL}
        </p>
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
