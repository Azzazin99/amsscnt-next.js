"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CAR_PERMISSION_ROLE_OPTIONS } from "@/lib/car/constants";
import { cn } from "@/lib/utils";
import type { DistrictStaffOption } from "@/lib/car/queries";

type CarPermissionFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  staffOptions: DistrictStaffOption[];
  title: string;
  cancelHref: string;
  defaultValues?: {
    userId: number;
    p1: number;
    officerPersonId: string | null;
  };
  lockUser?: boolean;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CarPermissionForm({
  action,
  staffOptions,
  title,
  cancelHref,
  defaultValues,
  lockUser = false,
}: CarPermissionFormProps) {
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
            required
            defaultValue={defaultValues?.userId ?? ""}
            className={inputClass}
          >
            <option value="">— เลือก —</option>
            {staffOptions.map((s) => (
              <option key={s.userId} value={s.userId}>
                {s.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">บทบาท (p1)</legend>
        <div className="space-y-2">
          {CAR_PERMISSION_ROLE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="p1"
                value={opt.value}
                defaultChecked={defaultValues?.p1 === opt.value || (!defaultValues && opt.value === 1)}
                required
              />
              {opt.label}
            </label>
          ))}
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
          defaultValue={defaultValues?.officerPersonId ?? ""}
          className={inputClass}
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
