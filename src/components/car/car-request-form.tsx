"use client";

import Link from "next/link";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button } from "@/components/ui/button";
import { bangkokTodayIso } from "@/lib/book/dates";
import { CAR_FUEL_OPTIONS } from "@/lib/car/constants";
import { cn } from "@/lib/utils";
import type { BookableVehicleOption } from "@/lib/car/queries";

type CarRequestFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  cancelHref: string;
  vehicles: BookableVehicleOption[];
  drivers: { personId: string; label: string }[];
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CarRequestForm({
  action,
  cancelHref,
  vehicles,
  drivers,
}: CarRequestFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const todayIso = bangkokTodayIso();

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
      <h2 className="text-lg font-semibold text-primary">ขออนุญาตใช้รถราชการ</h2>

      <div className="space-y-2">
        <label htmlFor="carCode" className="text-sm font-medium">
          ยานพาหนะ
        </label>
        <select id="carCode" name="carCode" required className={inputClass}>
          <option value="">— เลือก —</option>
          {vehicles.map((v) => (
            <option key={v.carCode} value={v.carCode}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="place" className="text-sm font-medium">
          สถานที่ไปราชการ
        </label>
        <input id="place" name="place" required maxLength={200} className={inputClass} />
      </div>

      <div className="space-y-2">
        <label htmlFor="because" className="text-sm font-medium">
          เพื่อวัตถุประสงค์
        </label>
        <input id="because" name="because" required maxLength={200} className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="carStart" className="text-sm font-medium">
            ตั้งแต่วันที่
          </label>
          <ThaiDatePicker id="carStart" name="carStart" minIso={todayIso} required />
        </div>
        <div className="space-y-2">
          <label htmlFor="carFinish" className="text-sm font-medium">
            ถึงวันที่
          </label>
          <ThaiDatePicker id="carFinish" name="carFinish" minIso={todayIso} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="timeStart" className="text-sm font-medium">
            เวลาเริ่ม (น.)
          </label>
          <input id="timeStart" name="timeStart" type="number" step="0.5" className={inputClass} />
        </div>
        <div className="space-y-2">
          <label htmlFor="timeFinish" className="text-sm font-medium">
            เวลาสิ้นสุด (น.)
          </label>
          <input id="timeFinish" name="timeFinish" type="number" step="0.5" className={inputClass} />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="personNum" className="text-sm font-medium">
          จำนวนผู้โดยสาร
        </label>
        <input id="personNum" name="personNum" type="number" min={1} className={inputClass} />
      </div>

      <div className="space-y-2">
        <label htmlFor="controlPerson" className="text-sm font-medium">
          ผู้ควบคุมรถ
        </label>
        <input id="controlPerson" name="controlPerson" maxLength={100} className={inputClass} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">เชื้อเพลิง</legend>
        {CAR_FUEL_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="fuel"
              value={opt.value}
              defaultChecked={opt.value === 0}
              required
            />
            {opt.label}
          </label>
        ))}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="project" className="text-sm font-medium">
            โครงการ (ถ้ามี)
          </label>
          <input id="project" name="project" maxLength={100} className={inputClass} />
        </div>
        <div className="space-y-2">
          <label htmlFor="activity" className="text-sm font-medium">
            กิจกรรม (ถ้ามี)
          </label>
          <input id="activity" name="activity" maxLength={100} className={inputClass} />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="money" className="text-sm font-medium">
          จำนวนเงิน (บาท)
        </label>
        <input id="money" name="money" type="number" step="0.01" className={inputClass} />
      </div>

      {drivers.length > 0 ? (
        <div className="space-y-2">
          <label htmlFor="driverPersonId" className="text-sm font-medium">
            พนักงานขับรถ
          </label>
          <select id="driverPersonId" name="driverPersonId" className={inputClass}>
            <option value="">— ไม่ระบุ —</option>
            {drivers.map((d) => (
              <option key={d.personId} value={d.personId}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

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
