"use client";

import Link from "next/link";
import { useState } from "react";
import { FieldError } from "@/components/shared/field-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { zodFieldErrors } from "@/lib/form/zod-client";
import { leavePermissionFormSchema } from "@/lib/leave/schemas";
import { cn } from "@/lib/utils";
import type { DistrictStaffOption } from "@/lib/leave/queries";

type LeavePermissionFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  staffOptions: DistrictStaffOption[];
  title: string;
  cancelHref: string;
  defaultValues?: {
    userId: number;
    p1: boolean;
    p2: boolean;
    officerPersonId: string | null;
  };
  lockUser?: boolean;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function BoolRadioGroup({
  name,
  label,
  defaultValue,
  hint,
  error,
}: {
  name: string;
  label: string;
  defaultValue: boolean;
  hint?: string;
  error?: string;
}) {
  return (
    <fieldset
      className={cn("space-y-2", error && "rounded-lg border border-destructive p-2")}
    >
      <legend className="text-sm font-medium">{label}</legend>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name={name}
            value="true"
            defaultChecked={defaultValue}
          />
          ใช่
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name={name}
            value="false"
            defaultChecked={!defaultValue}
          />
          ไม่ใช่
        </label>
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}

export function LeavePermissionForm({
  action,
  staffOptions,
  title,
  cancelHref,
  defaultValues,
  lockUser = false,
}: LeavePermissionFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    const formData = new FormData(e.currentTarget);
    const parsed = leavePermissionFormSchema.safeParse({
      userId: formData.get("userId"),
      p1: formData.get("p1"),
      p2: formData.get("p2"),
      officerPersonId: formData.get("officerPersonId"),
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
    <form noValidate onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      <div className="space-y-2">
        <label htmlFor="userId" className="text-sm font-medium">
          บุคลากร (เขต)
        </label>
        {lockUser && defaultValues ? (
          <>
            <input type="hidden" name="userId" value={defaultValues.userId} />
            <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              {staffOptions.find((s) => s.userId === defaultValues.userId)
                ?.label ?? `#${defaultValues.userId}`}
            </p>
          </>
        ) : (
          <select
            id="userId"
            name="userId"
            defaultValue={defaultValues?.userId ?? ""}
            aria-invalid={fieldErrors.userId ? true : undefined}
            className={cn(inputClass, fieldErrors.userId && "border-destructive")}
          >
            <option value="">— เลือก —</option>
            {staffOptions.map((s) => (
              <option key={s.userId} value={s.userId}>
                {s.label}
              </option>
            ))}
          </select>
        )}
        <FieldError message={fieldErrors.userId} />
      </div>

      <BoolRadioGroup
        name="p1"
        label="เจ้าหน้าที่ / อนุมัติ (p1)"
        defaultValue={defaultValues?.p1 ?? true}
        hint="ดูรายการและพิจารณาอนุมัติ"
        error={fieldErrors.p1}
      />
      <BoolRadioGroup
        name="p2"
        label="บันทึกคำขอ (p2)"
        defaultValue={defaultValues?.p2 ?? false}
        error={fieldErrors.p2}
      />

      <div className="space-y-2">
        <label htmlFor="officerPersonId" className="text-sm font-medium">
          เลขบัตรเจ้าหน้าที่ (ถ้ามี)
        </label>
        <input
          id="officerPersonId"
          name="officerPersonId"
          maxLength={13}
          defaultValue={defaultValues?.officerPersonId ?? ""}
          aria-invalid={fieldErrors.officerPersonId ? true : undefined}
          className={cn(inputClass, fieldErrors.officerPersonId && "border-destructive")}
          placeholder="13 หลัก — ว่างได้"
        />
        <FieldError message={fieldErrors.officerPersonId} />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={loading} className="min-h-11 min-w-28 justify-center">
          {loading ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
        <Link
          href={cancelHref}
          className={buttonVariants({ variant: "outline", className: "min-h-11 min-w-28 justify-center" })}
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
