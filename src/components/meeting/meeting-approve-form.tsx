"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MeetingApproveFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function MeetingApproveForm({ action }: MeetingApproveFormProps) {
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-4">
      <h3 className="font-medium">พิจารณาอนุมัติการใช้ห้อง</h3>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">ผลการพิจารณา</legend>
        <div className="flex gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="approve" value="1" required />
            อนุมัติ
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="approve" value="2" />
            ไม่อนุมัติ
          </label>
        </div>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="reason" className="text-sm font-medium">
          หมายเหตุ (ถ้ามี)
        </label>
        <input id="reason" name="reason" maxLength={200} className={inputClass} />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={loading} className={cn("min-h-11")}>
        {loading ? "กำลังบันทึก…" : "บันทึกผลพิจารณา"}
      </Button>
    </form>
  );
}
