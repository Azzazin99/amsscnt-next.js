"use client";

import { useState } from "react";
import { FieldError } from "@/components/shared/field-error";
import { Button } from "@/components/ui/button";
import { zodFieldErrors } from "@/lib/form/zod-client";
import { leaveYearFormSchema } from "@/lib/leave/schemas";
import { cn } from "@/lib/utils";

type LeaveYearFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  defaultValues?: {
    budgetYear: number;
    yearActive: boolean;
  };
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function LeaveYearForm({ action, defaultValues }: LeaveYearFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    const formData = new FormData(e.currentTarget);
    const parsed = leaveYearFormSchema.safeParse({
      budgetYear: formData.get("budgetYear"),
      yearActive: formData.get("yearActive"),
    });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    setLoading(true);
    try {
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
    <form
      noValidate
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
          min={2500}
          max={2700}
          defaultValue={defaultValues?.budgetYear ?? ""}
          aria-invalid={fieldErrors.budgetYear ? true : undefined}
          className={cn(inputClass, "w-32", fieldErrors.budgetYear && "border-destructive")}
        />
        <FieldError message={fieldErrors.budgetYear} />
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
