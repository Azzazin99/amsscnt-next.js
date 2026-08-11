"use client";

import Link from "next/link";
import { useState } from "react";
import { FieldError } from "@/components/shared/field-error";
import { Button } from "@/components/ui/button";
import { bookobecPermissionFormSchema } from "@/lib/bookobec/schemas";
import type { DistrictStaffOption } from "@/lib/bookobec/queries";
import { formDataToObject, zodFieldErrors } from "@/lib/form/zod-client";
import { cn } from "@/lib/utils";

type BookobecPermissionFormProps = {
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

export function BookobecPermissionForm({
  action,
  staffOptions,
  title,
  cancelHref,
  defaultValues,
  lockUser = false,
}: BookobecPermissionFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    const formData = new FormData(e.currentTarget);
    const parsed = bookobecPermissionFormSchema.safeParse(
      formDataToObject(formData),
    );
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
      className="mx-auto max-w-lg space-y-4"
    >
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
            className={cn(
              inputClass,
              fieldErrors.userId && "border-destructive",
            )}
            aria-invalid={fieldErrors.userId ? true : undefined}
            aria-describedby={fieldErrors.userId ? "userId-error" : undefined}
          >
            <option value="">— เลือก —</option>
            {staffOptions.map((s) => (
              <option key={s.userId} value={s.userId}>
                {s.label}
              </option>
            ))}
          </select>
        )}
        <FieldError id="userId-error" message={fieldErrors.userId} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">รับหนังสือ สพฐ.</legend>
        <p className="text-xs text-muted-foreground">
          ดูและดำเนินการรับหนังสือราชการจาก สพฐ.
        </p>
        <div className="flex gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="p1"
              value="true"
              defaultChecked={defaultValues?.p1 ?? true}
            />
            ใช่
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="p1"
              value="false"
              defaultChecked={defaultValues ? !defaultValues.p1 : false}
            />
            ไม่ใช่
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">ส่งหนังสือ สพฐ.</legend>
        <p className="text-xs text-muted-foreground">
          ดูและดำเนินการส่งหนังสือราชการไป สพฐ.
        </p>
        <div className="flex gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="p2"
              value="true"
              defaultChecked={defaultValues?.p2 ?? true}
            />
            ใช่
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="p2"
              value="false"
              defaultChecked={defaultValues ? !defaultValues.p2 : false}
            />
            ไม่ใช่
          </label>
        </div>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="officerPersonId" className="text-sm font-medium">
          เลขบัตรเจ้าหน้าที่ (ถ้ามี)
        </label>
        <input
          id="officerPersonId"
          name="officerPersonId"
          maxLength={13}
          inputMode="numeric"
          defaultValue={defaultValues?.officerPersonId ?? ""}
          className={cn(
            inputClass,
            fieldErrors.officerPersonId && "border-destructive",
          )}
          placeholder="13 หลัก — ว่างได้"
          aria-invalid={fieldErrors.officerPersonId ? true : undefined}
          aria-describedby={
            fieldErrors.officerPersonId ? "officerPersonId-error" : undefined
          }
        />
        <FieldError
          id="officerPersonId-error"
          message={fieldErrors.officerPersonId}
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
