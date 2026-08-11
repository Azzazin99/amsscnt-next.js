"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { BUDGET_PERMISSION_FIELDS } from "@/lib/budget/constants";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type PersonOption = { personId: string; displayName: string };

type BudgetPermissionFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  people?: PersonOption[];
  lockedPersonName?: string;
  cancelHref: string;
  defaultValues?: Partial<Record<(typeof BUDGET_PERMISSION_FIELDS)[number]["name"], number>>;
};

export function BudgetPermissionForm({
  action,
  people,
  lockedPersonName,
  cancelHref,
  defaultValues,
}: BudgetPermissionFormProps) {
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-6">
      <h3 className="text-center text-xl font-bold text-primary">
        {lockedPersonName ? "แก้ไขเจ้าหน้าที่การเงิน และกำหนดสิทธิหน้าที่" : "เพิ่มเจ้าหน้าที่การเงิน และกำหนดสิทธิหน้าที่"}
      </h3>

      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
          <label htmlFor="personId" className="text-sm font-medium shrink-0 min-w-36">
            บุคลากร
          </label>
          <div className="w-full max-w-xs">
            {lockedPersonName ? (
              <input readOnly value={lockedPersonName} className={`${inputClass} bg-muted`} />
            ) : (
              <select id="personId" name="personId" required className={inputClass} defaultValue="">
                <option value="">เลือก</option>
                {(people ?? []).map((p) => (
                  <option key={p.personId} value={p.personId}>
                    {p.displayName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {BUDGET_PERMISSION_FIELDS.map((p) => {
            const isChecked = (defaultValues?.[p.name] ?? 0) === 1;
            return (
              <div
                key={p.name}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm py-1 border-b border-muted/50 last:border-0"
              >
                <span className="font-medium text-foreground shrink-0 min-w-44">{p.label}</span>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name={p.name}
                      value="1"
                      defaultChecked={isChecked}
                      className="size-4 text-primary focus:ring-primary"
                    />
                    <span>ใช่</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name={p.name}
                      value="0"
                      defaultChecked={!isChecked}
                      className="size-4 text-primary focus:ring-primary"
                    />
                    <span>ไม่ใช่</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive text-center" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-center gap-4 pt-2">
        <Button type="submit" disabled={loading} className="min-h-11 min-w-28 justify-center">
          {loading ? "กำลังบันทึก…" : "ตกลง"}
        </Button>
        <Link href={cancelHref} className={buttonVariants({ variant: "outline", className: "min-h-11 min-w-28 justify-center" })}>
          ย้อนกลับ
        </Link>
      </div>
    </form>
  );
}
