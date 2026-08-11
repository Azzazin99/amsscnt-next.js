"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { BUDGET_PAY_GROUPS } from "@/lib/budget/constants";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type BudgetPayTypeFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  cancelHref: string;
  defaultValues?: { payGroupId: number; payTypeId: number; payTypeName: string };
};

export function BudgetPayTypeForm({
  action,
  cancelHref,
  defaultValues,
}: BudgetPayTypeFormProps) {
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
        <label htmlFor="payGroupId" className="text-sm font-medium">
          งบรายจ่าย
        </label>
        <select
          id="payGroupId"
          name="payGroupId"
          required
          defaultValue={defaultValues?.payGroupId ?? ""}
          className={inputClass}
        >
          <option value="">— เลือกงบรายจ่าย —</option>
          {Object.entries(BUDGET_PAY_GROUPS).map(([value, label]) => (
            <option key={value} value={value}>
              {value} {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="payTypeId" className="text-sm font-medium">
          รหัสประเภทรายการจ่าย
        </label>
        <input
          id="payTypeId"
          name="payTypeId"
          type="number"
          min={1}
          required
          defaultValue={defaultValues?.payTypeId ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="payTypeName" className="text-sm font-medium">
          ชื่อประเภทรายการจ่าย
        </label>
        <input
          id="payTypeName"
          name="payTypeName"
          required
          maxLength={100}
          defaultValue={defaultValues?.payTypeName ?? ""}
          className={inputClass}
        />
      </div>

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
