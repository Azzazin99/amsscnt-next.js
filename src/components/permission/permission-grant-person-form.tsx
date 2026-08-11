"use client";

import Link from "next/link";
import { useState } from "react";
import { FieldError } from "@/components/shared/field-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { zodFieldErrors } from "@/lib/form/zod-client";
import type { PersonOption } from "@/lib/permission/grant-persons-queries";
import { permissionGrantPersonFormSchema } from "@/lib/permission/schemas";
import { cn } from "@/lib/utils";

type PermissionGrantPersonFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  personLabel: string;
  positionLabel: string;
  schoolLabel: string | null;
  cancelHref: string;
  personOptions: PersonOption[];
  defaultValues?: {
    groupPersonId: string | null;
    grantPersonId: string | null;
  };
};

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function PersonSelect({
  id,
  name,
  label,
  options,
  defaultValue,
  error,
}: {
  id: string;
  name: string;
  label: string;
  options: PersonOption[];
  defaultValue: string | null;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        className={cn(selectClass, error && "border-destructive")}
      >
        <option value="">— ไม่ระบุ —</option>
        {options.map((opt) => (
          <option key={opt.personId} value={opt.personId}>
            {opt.label}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  );
}

export function PermissionGrantPersonForm({
  action,
  personLabel,
  positionLabel,
  schoolLabel,
  cancelHref,
  personOptions,
  defaultValues,
}: PermissionGrantPersonFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    const formData = new FormData(e.currentTarget);
    const parsed = permissionGrantPersonFormSchema.safeParse({
      groupPersonId: formData.get("groupPersonId"),
      grantPersonId: formData.get("grantPersonId"),
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
      <h2 className="text-lg font-semibold text-primary">กำหนดผู้อนุมัติ</h2>

      <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
        <p className="font-medium">{personLabel}</p>
        <p className="text-muted-foreground">{positionLabel}</p>
        {schoolLabel ? (
          <p className="text-muted-foreground">{schoolLabel}</p>
        ) : null}
      </div>

      <PersonSelect
        id="groupPersonId"
        name="groupPersonId"
        label="ผู้บังคับบัญชาชั้นต้น"
        options={personOptions}
        defaultValue={defaultValues?.groupPersonId ?? null}
        error={fieldErrors.groupPersonId}
      />
      <PersonSelect
        id="grantPersonId"
        name="grantPersonId"
        label="ผู้บังคับบัญชา (ผู้อนุมัติ)"
        options={personOptions}
        defaultValue={defaultValues?.grantPersonId ?? null}
        error={fieldErrors.grantPersonId}
      />

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
