"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PlanYearFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  defaultValues?: {
    budgetYear: number;
    yearActive: boolean;
  };
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function PlanYearForm({ action, defaultValues }: PlanYearFormProps) {
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
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-4"
    >
      <div className="space-y-1">
        <label htmlFor="budgetYear" className="text-xs font-medium">
          ปีงบประมาณ (พ.ศ.)
        </label>
        <input
          id="budgetYear"
          name="budgetYear"
          type="number"
          required
          min={2500}
          max={2700}
          defaultValue={defaultValues?.budgetYear ?? ""}
          className={cn(inputClass, "w-32")}
        />
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="yearActive"
          defaultChecked={defaultValues?.yearActive ?? false}
          className="size-4 rounded border-input"
        />
        ตั้งเป็นปีปัจจุบัน
      </label>

      {error ? (
        <p className="w-full text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={loading} className="min-h-11">
        {loading ? "กำลังบันทึก…" : defaultValues ? "บันทึก" : "เพิ่มปี"}
      </Button>
    </form>
  );
}
