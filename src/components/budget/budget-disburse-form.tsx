"use client";

import Link from "next/link";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type PayTypeOption = { payTypeId: number; payTypeName: string };

type BudgetDisburseFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  payTypes: PayTypeOption[];
  cancelHref: string;
  defaultValues?: {
    recDate: string;
    doc: string;
    item: string;
    payGroup: number;
    payAmount: number;
    payedPerson: string | null;
  };
};

export function BudgetDisburseForm({
  action,
  payTypes,
  cancelHref,
  defaultValues,
}: BudgetDisburseFormProps) {
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
          <ThaiDatePicker
            id="recDate"
            name="recDate"
            defaultValue={defaultValues?.recDate ?? ""}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="doc" className="text-sm font-medium">
            ที่เอกสาร
          </label>
          <input
            id="doc"
            name="doc"
            required
            maxLength={30}
            defaultValue={defaultValues?.doc ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="item" className="text-sm font-medium">
            รายการจ่าย
          </label>
          <input
            id="item"
            name="item"
            required
            maxLength={100}
            defaultValue={defaultValues?.item ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="payGroup" className="text-sm font-medium">
            งบรายจ่าย
          </label>
          <select
            id="payGroup"
            name="payGroup"
            required
            defaultValue={defaultValues?.payGroup ?? ""}
            className={inputClass}
          >
            <option value="">— เลือก —</option>
            {payTypes.map((pt) => (
              <option key={pt.payTypeId} value={pt.payTypeId}>
                {pt.payTypeName}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="payAmount" className="text-sm font-medium">
            จำนวนเงิน (บาท)
          </label>
          <input
            id="payAmount"
            name="payAmount"
            type="number"
            min={0.01}
            step="0.01"
            required
            defaultValue={defaultValues?.payAmount ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="payedPerson" className="text-sm font-medium">
            ผู้รับเงิน
          </label>
          <input
            id="payedPerson"
            name="payedPerson"
            maxLength={50}
            defaultValue={defaultValues?.payedPerson ?? ""}
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
