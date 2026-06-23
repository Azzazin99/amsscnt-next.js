"use client";

import { useState } from "react";
import { FieldError } from "@/components/shared/field-error";
import { Button } from "@/components/ui/button";
import { formDataToObject, zodFieldErrors } from "@/lib/form/zod-client";
import type { WorkflowStatus } from "@/lib/leave/constants";
import { leaveStepApproveSchema } from "@/lib/leave/schemas";
import { cn } from "@/lib/utils";

type ApproveStep = Extract<WorkflowStatus, "group" | "group2" | "commander">;

type LeaveApproveFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  step: ApproveStep;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const STEP_LABELS: Record<ApproveStep, string> = {
  group: "ความเห็นผอ.กลุ่ม",
  group2: "ความเห็นรอง ผอ.สพท.",
  commander: "ความเห็นผอ.สพท.",
};

const STEP_TITLES: Record<ApproveStep, string> = {
  group: "ผอ.กลุ่ม",
  group2: "รอง ผอ.สพท.",
  commander: "ผอ.สพท.",
};

export function LeaveApproveForm({ action, step }: LeaveApproveFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    const formData = new FormData(e.currentTarget);
    const parsed = leaveStepApproveSchema.safeParse(formDataToObject(formData));
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
    <form noValidate onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
      <h3 className="font-semibold text-primary">
        พิจารณาอนุมัติ — {STEP_TITLES[step]}
      </h3>
      <input type="hidden" name="step" value={step} />

      <fieldset
        className={cn("space-y-2", fieldErrors.grant && "rounded-lg border border-destructive p-2")}
      >
        <legend className="text-sm font-medium">ผลการพิจารณา</legend>
        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="grant" value="1" />
            เห็นควรอนุมัติ
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="grant" value="0" />
            ไม่เห็นควรอนุมัติ
          </label>
        </div>
        <FieldError message={fieldErrors.grant} />
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="comment" className="text-sm font-medium">
          {STEP_LABELS[step]}
        </label>
        <input
          id="comment"
          name="comment"
          maxLength={200}
          aria-invalid={fieldErrors.comment ? true : undefined}
          className={cn(inputClass, fieldErrors.comment && "border-destructive")}
        />
        <FieldError message={fieldErrors.comment} />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={loading} className="min-h-11">
        {loading ? "กำลังบันทึก…" : "บันทึกผลพิจารณา"}
      </Button>
    </form>
  );
}
