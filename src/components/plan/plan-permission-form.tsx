"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type PersonOption = { personId: string; displayName: string };

type PlanPermissionFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  people?: PersonOption[];
  lockedPersonName?: string;
  cancelHref: string;
  defaultValues?: {
    permAdd: number;
    permEdit: number;
    permDele: number;
  };
};

const PERMS = [
  { name: "permAdd", label: "เพิ่มข้อมูล" },
  { name: "permEdit", label: "แก้ไขข้อมูล" },
  { name: "permDele", label: "ลบข้อมูล" },
] as const;

export function PlanPermissionForm({
  action,
  people,
  lockedPersonName,
  cancelHref,
  defaultValues,
}: PlanPermissionFormProps) {
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
      /* redirect throws */
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <div className="space-y-1">
        <label htmlFor="personId" className="text-sm font-medium">
          บุคลากร
        </label>
        {lockedPersonName ? (
          <input readOnly value={lockedPersonName} className={`${inputClass} bg-muted`} />
        ) : (
          <select id="personId" name="personId" required className={inputClass} defaultValue="">
            <option value="">— เลือกบุคลากร —</option>
            {(people ?? []).map((p) => (
              <option key={p.personId} value={p.personId}>
                {p.displayName}
              </option>
            ))}
          </select>
        )}
      </div>

      <fieldset className="space-y-2 rounded-xl border bg-muted/30 p-4">
        <legend className="px-1 text-sm font-medium">สิทธิ์การใช้งาน</legend>
        {PERMS.map((p) => (
          <label key={p.name} className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={p.name}
              value="1"
              defaultChecked={
                (defaultValues?.[p.name as keyof typeof defaultValues] ?? 0) === 1
              }
              className="size-4 rounded border-input"
            />
            {p.label}
          </label>
        ))}
      </fieldset>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading} className="min-h-11 min-w-28 justify-center">
          {loading ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
        <Link href={cancelHref} className={buttonVariants({ variant: "outline", className: "min-h-11 min-w-28 justify-center" })}>
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
