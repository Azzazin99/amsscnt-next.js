"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DistrictStaffOption } from "@/lib/book/permissions/queries";

type BookPermissionFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  staffOptions: DistrictStaffOption[];
  title: string;
  cancelHref: string;
  defaultValues?: {
    userId: number;
    p1: boolean;
    p2: boolean;
    p3: boolean;
    canViewSecret: boolean;
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
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      <div className="flex gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name={name}
            value="1"
            defaultChecked={defaultValue}
            required
          />
          ใช่
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name={name}
            value="0"
            defaultChecked={!defaultValue}
          />
          ไม่ใช่
        </label>
      </div>
    </fieldset>
  );
}

export function BookPermissionForm({
  action,
  staffOptions,
  title,
  cancelHref,
  defaultValues,
  lockUser = false,
}: BookPermissionFormProps) {
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
          บุคลากร
        </label>
        {lockUser && defaultValues ? (
          <>
            <input type="hidden" name="userId" value={defaultValues.userId} />
            <p className={cn(inputClass, "bg-muted/40 flex items-center")}>
              {staffOptions.find((s) => s.userId === defaultValues.userId)
                ?.label ?? defaultValues.userId}
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
            <option value="">เลือกบุคลากร</option>
            {staffOptions.map((staff) => (
              <option key={staff.userId} value={staff.userId}>
                {staff.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <BoolRadioGroup
        name="p1"
        label="สิทธิ์ทั่วไป (p1 - ดูทะเบียน/จัดการกลุ่ม)"
        defaultValue={defaultValues?.p1 !== false}
      />
      <BoolRadioGroup
        name="p2"
        label="สิทธิ์บันทึก/ส่งหนังสือ (p2)"
        defaultValue={defaultValues?.p2 === true}
      />
      <BoolRadioGroup
        name="canViewSecret"
        label="ดูหนังสือชั้นความลับ"
        defaultValue={defaultValues?.canViewSecret === true}
        hint="สำหรับบุคลากรที่มีสิทธิ์เข้าถึงหนังสือชั้นความลับ"
      />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={loading} className="min-w-28">
          {loading ? "กำลังบันทึก..." : "ตกลง"}
        </Button>
        <Link
          href={cancelHref}
          className={cn(buttonVariants({ variant: "outline" }), "min-w-28")}
        >
          ย้อนกลับ
        </Link>
      </div>
    </form>
  );
}
