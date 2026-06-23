"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CAR_VEHICLE_STATUS_OPTIONS } from "@/lib/car/constants";
import { cn } from "@/lib/utils";
import type { CarTypeRow } from "@/lib/car/queries";

type CarVehicleFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  types: CarTypeRow[];
  title: string;
  cancelHref: string;
  defaultValues?: {
    carCode: number;
    carTypeCode: number;
    carNumber: string;
    name: string;
    status: number;
    pic: string | null;
  };
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CarVehicleForm({
  action,
  types,
  title,
  cancelHref,
  defaultValues,
}: CarVehicleFormProps) {
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
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      <div className="space-y-2">
        <label htmlFor="carTypeCode" className="text-sm font-medium">
          ประเภท
        </label>
        <select
          id="carTypeCode"
          name="carTypeCode"
          required
          defaultValue={defaultValues?.carTypeCode ?? ""}
          className={inputClass}
        >
          <option value="">— เลือก —</option>
          {types.map((t) => (
            <option key={t.id} value={t.code}>
              {t.code} {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="carCode" className="text-sm font-medium">
          รหัสยานพาหนะ
        </label>
        <input
          id="carCode"
          name="carCode"
          type="number"
          required
          defaultValue={defaultValues?.carCode ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          ชื่อยานพาหนะ
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={150}
          defaultValue={defaultValues?.name ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="carNumber" className="text-sm font-medium">
          ทะเบียน
        </label>
        <input
          id="carNumber"
          name="carNumber"
          required
          maxLength={100}
          defaultValue={defaultValues?.carNumber ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">
          สถานะ
        </label>
        <select
          id="status"
          name="status"
          required
          defaultValue={defaultValues?.status ?? 2}
          className={inputClass}
        >
          {CAR_VEHICLE_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="pic" className="text-sm font-medium">
          ที่อยู่รูปภาพ (ถ้ามี)
        </label>
        <input
          id="pic"
          name="pic"
          maxLength={150}
          defaultValue={defaultValues?.pic ?? ""}
          className={inputClass}
          placeholder="URL หรือ path — v1 ยังไม่อัปโหลดไฟล์"
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
