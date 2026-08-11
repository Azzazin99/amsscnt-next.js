"use client";

import Link from "next/link";
import { useState } from "react";
import { FieldError } from "@/components/shared/field-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { zodFieldErrors } from "@/lib/form/zod-client";
import { schoolGrantDeputyFormSchema } from "@/lib/leave/schemas";
import type { DeputyStaffOption } from "@/lib/leave/school-grant-queries";
import { cn } from "@/lib/utils";

type LeaveSchoolGrantFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  staffOptions: DeputyStaffOption[];
  title: string;
  cancelHref: string;
  defaultUserId?: number;
  lockUser?: boolean;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function LeaveSchoolGrantForm({
  action,
  staffOptions,
  title,
  cancelHref,
  defaultUserId,
  lockUser = false,
}: LeaveSchoolGrantFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    const formData = new FormData(e.currentTarget);
    const parsed = schoolGrantDeputyFormSchema.safeParse({
      userId: formData.get("userId"),
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
      <p className="text-sm text-muted-foreground">
        รองผู้อำนวยการเขตที่ปฏิบัติราชการแทนในการอนุมัติลาผู้อำนวยการโรงเรียน
      </p>

      <div className="space-y-2">
        <label htmlFor="userId" className="text-sm font-medium">
          รองผู้อำนวยการเขต
        </label>
        {lockUser && defaultUserId ? (
          <>
            <input type="hidden" name="userId" value={defaultUserId} />
            <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              {staffOptions.find((s) => s.userId === defaultUserId)?.label ??
                `#${defaultUserId}`}
            </p>
          </>
        ) : (
          <select
            id="userId"
            name="userId"
            defaultValue={defaultUserId ?? ""}
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
