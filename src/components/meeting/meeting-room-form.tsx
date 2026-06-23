"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MeetingRoomFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  cancelHref: string;
  roomCode: number;
  defaultValues: {
    roomName: string;
    active: boolean;
  };
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function MeetingRoomForm({
  action,
  cancelHref,
  roomCode,
  defaultValues,
}: MeetingRoomFormProps) {
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
      <h2 className="text-lg font-semibold text-primary">
        แก้ไขห้องประชุม #{roomCode}
      </h2>

      <div className="space-y-2">
        <label htmlFor="roomName" className="text-sm font-medium">
          ชื่อห้องประชุม
        </label>
        <input
          id="roomName"
          name="roomName"
          required
          maxLength={100}
          defaultValue={defaultValues.roomName}
          className={inputClass}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">สถานะ</legend>
        <div className="flex gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="active"
              value="true"
              defaultChecked={defaultValues.active}
              required
            />
            เปิดใช้งาน
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="active"
              value="false"
              defaultChecked={!defaultValues.active}
            />
            ปิดใช้งาน
          </label>
        </div>
      </fieldset>

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
