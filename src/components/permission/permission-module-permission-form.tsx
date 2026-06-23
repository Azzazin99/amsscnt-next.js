"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DistrictStaffOption } from "@/lib/permission/queries";

type PermissionModulePermissionFormProps = {
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
}: {
  name: string;
  label: string;
  defaultValue: boolean;
  hint?: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name={name}
            value="true"
            defaultChecked={defaultValue}
            required
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
    </fieldset>
  );
}

export function PermissionModulePermissionForm({
  action,
  staffOptions,
  title,
  cancelHref,
  defaultValues,
  lockUser = false,
}: PermissionModulePermissionFormProps) {
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

      <BoolRadioGroup
        name="p1"
        label="เจ้าหน้าที่ / อนุมัติ (p1)"
        defaultValue={defaultValues?.p1 ?? true}
        hint="ดูรายการและพิจารณาอนุมัติ"
      />
      <BoolRadioGroup
        name="p2"
        label="อนุมัติส่วนโรงเรียน (p2)"
        defaultValue={defaultValues?.p2 ?? false}
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
          className={inputClass}
          placeholder="13 หลัก — ว่างได้"
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
