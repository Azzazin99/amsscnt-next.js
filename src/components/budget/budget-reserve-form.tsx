"use client";

import Link from "next/link";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type WithdrawOption = { id: number | string; label: string };

type BudgetReserveFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  budgetYear: number;
  withdrawOptions: WithdrawOption[];
  cancelHref: string;
};

export function BudgetReserveForm({
  action,
  budgetYear,
  withdrawOptions,
  cancelHref,
}: BudgetReserveFormProps) {
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
    <section className="space-y-6">
      {/* Title Header */}
      <div className="text-center py-2">
        <h2 className="text-xl font-bold text-teal-800 dark:text-teal-400">
          จ่ายเงินทดรองราชการ ปีงบประมาณ {budgetYear}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-4">
          {/* วันเดือนปี */}
          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] items-center gap-2">
            <label htmlFor="recDate" className="text-sm font-medium sm:text-right">
              วันเดือนปี
            </label>
            <div className="max-w-[200px]">
              <ThaiDatePicker id="recDate" name="recDate" required />
            </div>
          </div>

          {/* ที่เอกสาร */}
          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] items-center gap-2">
            <label htmlFor="document" className="text-sm font-medium sm:text-right">
              ที่เอกสาร
            </label>
            <div className="max-w-xs">
              <input
                id="document"
                name="document"
                required
                maxLength={30}
                className={inputClass}
              />
            </div>
          </div>

          {/* อ้างอิงทะเบียนขอเบิก/ขอยืมเงิน */}
          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] items-center gap-2">
            <label htmlFor="referWdId" className="text-sm font-medium sm:text-right">
              อ้างอิงทะเบียนขอเบิก/ขอยืมเงิน
            </label>
            <div className="max-w-xl">
              <select id="referWdId" name="referWdId" className={inputClass}>
                <option value="">เลือก</option>
                {withdrawOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* รายการจ่าย */}
          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] items-center gap-2">
            <label htmlFor="item" className="text-sm font-medium sm:text-right">
              รายการจ่าย
            </label>
            <div className="max-w-xl">
              <input
                id="item"
                name="item"
                required
                maxLength={100}
                className={inputClass}
              />
            </div>
          </div>

          {/* จำนวนเงิน */}
          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] items-center gap-2">
            <label htmlFor="payAmount" className="text-sm font-medium sm:text-right">
              จำนวนเงิน
            </label>
            <div className="max-w-[200px]">
              <input
                id="payAmount"
                name="payAmount"
                type="number"
                min={0.01}
                step="0.01"
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* ผู้รับเงิน */}
          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] items-center gap-2">
            <label htmlFor="borrowedPerson" className="text-sm font-medium sm:text-right">
              ผู้รับเงิน
            </label>
            <div className="max-w-md">
              <input
                id="borrowedPerson"
                name="borrowedPerson"
                maxLength={50}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive text-center font-medium" role="alert">
            {error}
          </p>
        ) : null}

        {/* Buttons (Bottom Right) */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="min-h-10 px-6 font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-400 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white dark:border-slate-500 shadow-xs"
          >
            {loading ? "กำลังบันทึก…" : "ตกลง"}
          </Button>
          <Link
            href={cancelHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "min-h-10 px-6 font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-400 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white dark:border-slate-500 shadow-xs",
            )}
          >
            ย้อนกลับ
          </Link>
        </div>
      </form>
    </section>
  );
}
