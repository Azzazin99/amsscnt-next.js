"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { SchoolGroupOption } from "@/lib/core/schools/queries";
import { SCHOOL_TYPE_OPTIONS } from "@/lib/core/schools/school-type-labels";
import { cn } from "@/lib/utils";

type SchoolFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  title: string;
  cancelHref: string;
  schoolGroups: SchoolGroupOption[];
  mode: "create" | "edit";
  defaultValues?: {
    schoolCode?: string;
    name?: string;
    schoolType?: number;
    schoolGroupId?: number | null;
    active?: boolean;
  };
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SchoolForm({
  action,
  title,
  cancelHref,
  schoolGroups,
  mode,
  defaultValues,
}: SchoolFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await action(formData);
      if (result && "ok" in result && !result.ok) {
        setError(result.message ?? "บันทึกไม่สำเร็จ");
        return;
      }
      if (
        mode === "create" &&
        result &&
        "ok" in result &&
        result.ok &&
        "id" in result &&
        typeof result.id === "number"
      ) {
        router.push(`/admin/schools/${result.id}/edit`);
        router.refresh();
        return;
      }
      router.refresh();
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const defaultGroup =
    defaultValues?.schoolGroupId != null
      ? String(defaultValues.schoolGroupId)
      : "";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      <div className="space-y-2">
        <label htmlFor="schoolCode" className="text-sm font-medium">
          รหัสสถานศึกษา
        </label>
        {mode === "create" ? (
          <input
            id="schoolCode"
            name="schoolCode"
            type="text"
            required
            maxLength={12}
            placeholder="เช่น 1010010101"
            defaultValue={defaultValues?.schoolCode ?? ""}
            className={inputClass}
          />
        ) : (
          <>
            <input type="hidden" name="schoolCode" value={defaultValues?.schoolCode ?? ""} />
            <p
              id="schoolCode"
              className="rounded-lg border border-input bg-muted/40 px-3 py-2 font-mono text-sm"
            >
              {defaultValues?.schoolCode}
            </p>
          </>
        )}
        {mode === "edit" ? (
          <p className="text-xs text-muted-foreground">
            ไม่แก้รหัสหลังสร้าง — กระทบ login และข้อมูลที่อ้างอิงรหัส
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          ชื่อสถานศึกษา
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="schoolType" className="text-sm font-medium">
          ประเภท
        </label>
        <select
          id="schoolType"
          name="schoolType"
          required
          defaultValue={String(defaultValues?.schoolType ?? 1)}
          className={selectClass}
        >
          {SCHOOL_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="schoolGroupId" className="text-sm font-medium">
          กลุ่มสถานศึกษา
        </label>
        <select
          id="schoolGroupId"
          name="schoolGroupId"
          defaultValue={defaultGroup}
          className={selectClass}
        >
          <option value="">— ไม่ระบุ —</option>
          {schoolGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        {schoolGroups.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            ยังไม่มีกลุ่มสถานศึกษา —{" "}
            <Link href="/admin/school-groups" className="underline hover:no-underline">
              ตั้งค่าที่เมนูกลุ่มสถานศึกษา
            </Link>
          </p>
        ) : null}
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaultValues?.active ?? true}
          className="size-4 rounded border-input"
        />
        เปิดใช้งาน (แสดงในระบบและ login)
      </label>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={loading} className="min-h-11 min-w-28 justify-center">
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
        <Link
          href={cancelHref}
          className={buttonVariants({ variant: "outline", className: "min-h-11 min-w-28 justify-center" })}
        >
          ย้อนกลับ
        </Link>
      </div>
    </form>
  );
}
