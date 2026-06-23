"use client";

import Link from "next/link";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button } from "@/components/ui/button";
import { MEETING_TIME_OPTIONS } from "@/lib/meeting/constants";
import type { MeetingRoomRow } from "@/lib/meeting/queries";
import { cn } from "@/lib/utils";

type MeetingBookingFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  rooms: MeetingRoomRow[];
  cancelHref: string;
  defaultRoomCode?: number | null;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function MeetingBookingForm({
  action,
  rooms,
  cancelHref,
  defaultRoomCode,
}: MeetingBookingFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Bangkok",
  });

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
      <h2 className="text-lg font-semibold text-primary">จองห้องประชุม</h2>

      <div className="space-y-2">
        <label htmlFor="roomCode" className="text-sm font-medium">
          ห้องประชุม
        </label>
        <select
          id="roomCode"
          name="roomCode"
          required
          defaultValue={defaultRoomCode ?? ""}
          className={inputClass}
        >
          <option value="">— เลือก —</option>
          {rooms.map((room) => (
            <option key={room.roomCode} value={room.roomCode}>
              {room.roomName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="bookDate" className="text-sm font-medium">
            วันเริ่มใช้ห้อง
          </label>
          <ThaiDatePicker
            id="bookDate"
            name="bookDate"
            defaultValue={today}
            minIso={today}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="bookDateEnd" className="text-sm font-medium">
            วันสิ้นสุดใช้ห้อง
          </label>
          <ThaiDatePicker
            id="bookDateEnd"
            name="bookDateEnd"
            defaultValue={today}
            minIso={today}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="startTime" className="text-sm font-medium">
            ตั้งแต่เวลา
          </label>
          <select
            id="startTime"
            name="startTime"
            required
            defaultValue={8}
            className={inputClass}
          >
            <option value="">— เลือก —</option>
            {MEETING_TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="finishTime" className="text-sm font-medium">
            ถึงเวลา
          </label>
          <select
            id="finishTime"
            name="finishTime"
            required
            defaultValue={16}
            className={inputClass}
          >
            <option value="">— เลือก —</option>
            {MEETING_TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="objective" className="text-sm font-medium">
          วัตถุประสงค์
        </label>
        <input
          id="objective"
          name="objective"
          required
          maxLength={200}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="personNum" className="text-sm font-medium">
          จำนวนผู้เข้าประชุม (คน)
        </label>
        <input
          id="personNum"
          name="personNum"
          type="number"
          min={1}
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="other" className="text-sm font-medium">
          อื่น ๆ (ถ้ามี)
        </label>
        <input id="other" name="other" maxLength={200} className={inputClass} />
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
