"use client";

import Link from "next/link";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { BUDGET_CHANGE_STATUS } from "@/lib/budget/constants";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type TypeOption = { typeId: number; typeName: string };

type BudgetStatusChangeFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  cancelHref: string;
  types?: TypeOption[];
};

export function BudgetStatusChangeForm({
  action,
  cancelHref,
  types,
}: BudgetStatusChangeFormProps) {
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="recDate" className="text-sm font-medium">
            วันที่
          </label>
          <ThaiDatePicker id="recDate" name="recDate" defaultValue="" required />
        </div>

        <div className="space-y-1">
          <label htmlFor="doc" className="text-sm font-medium">
            ที่เอกสาร
          </label>
          <input id="doc" name="doc" required maxLength={30} className={inputClass} />
        </div>

        {types ? (
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="typeId" className="text-sm font-medium">
              ประเภทเงิน
            </label>
            <select id="typeId" name="typeId" required defaultValue="" className={inputClass}>
              <option value="">— เลือกประเภทเงิน —</option>
              {types.map((t) => (
                <option key={t.typeId} value={t.typeId}>
                  {t.typeId} {t.typeName}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="item" className="text-sm font-medium">
            รายการ
          </label>
          <input id="item" name="item" required maxLength={100} className={inputClass} />
        </div>

        <div className="space-y-1">
          <label htmlFor="status" className="text-sm font-medium">
            ลักษณะรายการ
          </label>
          <select id="status" name="status" required defaultValue="" className={inputClass}>
            <option value="">— เลือก —</option>
            {Object.entries(BUDGET_CHANGE_STATUS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="changeAmount" className="text-sm font-medium">
            จำนวนเงิน (บาท)
          </label>
          <input
            id="changeAmount"
            name="changeAmount"
            type="number"
            min={0.01}
            step="0.01"
            required
            className={inputClass}
          />
        </div>
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
