"use client";

import Link from "next/link";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { BUDGET_PAY_GROUPS } from "@/lib/budget/constants";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type BudgetDeegaFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  cancelHref: string;
  defaultValues?: {
    recDate: string;
    deegaNum: number | null;
    doc: string;
    receiveNum: string;
    plan: string;
    project: string;
    activity: string;
    payGroup: number | null;
    item: string;
    withdraw: number;
    tax: number;
    pay: number;
    directPay: number;
    directPayName: string;
  };
};

export function BudgetDeegaForm({
  action,
  cancelHref,
  defaultValues,
}: BudgetDeegaFormProps) {
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
          <label htmlFor="deegaNum" className="text-sm font-medium">
            เลขที่ฎีกา (ลำดับ)
          </label>
          <input
            id="deegaNum"
            name="deegaNum"
            type="number"
            min={0}
            defaultValue={defaultValues?.deegaNum ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="doc" className="text-sm font-medium">
            เลขที่เอกสารฎีกา
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

        <div className="space-y-1">
          <label htmlFor="receiveNum" className="text-sm font-medium">
            อ้างอิงการขอเบิก
          </label>
          <input
            id="receiveNum"
            name="receiveNum"
            maxLength={20}
            defaultValue={defaultValues?.receiveNum ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="plan" className="text-sm font-medium">
            แผนงาน
          </label>
          <input
            id="plan"
            name="plan"
            maxLength={6}
            defaultValue={defaultValues?.plan ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="project" className="text-sm font-medium">
            โครงการ
          </label>
          <input
            id="project"
            name="project"
            maxLength={20}
            defaultValue={defaultValues?.project ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="activity" className="text-sm font-medium">
            กิจกรรม
          </label>
          <input
            id="activity"
            name="activity"
            maxLength={20}
            defaultValue={defaultValues?.activity ?? ""}
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
            defaultValue={defaultValues?.payGroup ?? ""}
            className={inputClass}
          >
            <option value="">— เลือก —</option>
            {Object.entries(BUDGET_PAY_GROUPS).map(([value, label]) => (
              <option key={value} value={value}>
                {value} {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="item" className="text-sm font-medium">
            รายการ
          </label>
          <input
            id="item"
            name="item"
            required
            maxLength={250}
            defaultValue={defaultValues?.item ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="withdraw" className="text-sm font-medium">
            ยอดขอเบิก
          </label>
          <input
            id="withdraw"
            name="withdraw"
            type="number"
            min={0}
            step="0.01"
            defaultValue={defaultValues?.withdraw ?? 0}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="tax" className="text-sm font-medium">
            ภาษี/หัก ณ ที่จ่าย
          </label>
          <input
            id="tax"
            name="tax"
            type="number"
            min={0}
            step="0.01"
            defaultValue={defaultValues?.tax ?? 0}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="pay" className="text-sm font-medium">
            ยอดจ่ายจริง
          </label>
          <input
            id="pay"
            name="pay"
            type="number"
            min={0}
            step="0.01"
            defaultValue={defaultValues?.pay ?? 0}
            className={inputClass}
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="directPayName" className="text-sm font-medium">
            จ่ายตรงให้ (ถ้ามี)
          </label>
          <input
            id="directPayName"
            name="directPayName"
            maxLength={200}
            defaultValue={defaultValues?.directPayName ?? ""}
            className={inputClass}
          />
        </div>

        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="directPay"
            value="1"
            defaultChecked={(defaultValues?.directPay ?? 0) === 1}
            className="size-4 rounded border-input"
          />
          เป็นการจ่ายตรงจากกรมบัญชีกลาง
        </label>
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
