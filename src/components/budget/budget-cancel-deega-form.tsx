"use client";

import Link from "next/link";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type DeegaOption = { id: number; label: string };

type BudgetCancelDeegaFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  budgetYear: number;
  deegaOptions: DeegaOption[];
  cancelHref: string;
};

export function BudgetCancelDeegaForm({
  action,
  budgetYear,
  deegaOptions,
  cancelHref,
}: BudgetCancelDeegaFormProps) {
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
          ยกเลิกฎีกา ปีงบประมาณ {budgetYear}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-4">
          {/* วันเดือนปี */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
            <label htmlFor="recDate" className="text-sm font-medium sm:text-right">
              วันเดือนปี
            </label>
            <div className="max-w-[200px]">
              <ThaiDatePicker id="recDate" name="recDate" required />
            </div>
          </div>

          {/* เลขที่ฎีกา */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
            <label htmlFor="deega" className="text-sm font-medium sm:text-right">
              เลขที่ฎีกา
            </label>
            <div className="max-w-xs">
              <select id="deega" name="deega" required className={inputClass}>
                <option value="">เลือก</option>
                {deegaOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ที่เอกสารอ้างอิง */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
            <label htmlFor="ref" className="text-sm font-medium sm:text-right">
              ที่เอกสารอ้างอิง
            </label>
            <div className="max-w-md">
              <input
                id="ref"
                name="ref"
                type="text"
                maxLength={15}
                className={inputClass}
              />
            </div>
          </div>

          {/* สาเหตุการยกเลิก */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-2">
            <label htmlFor="comment" className="text-sm font-medium sm:text-right">
              สาเหตุการยกเลิก
            </label>
            <div className="max-w-xl">
              <input
                id="comment"
                name="comment"
                type="text"
                maxLength={150}
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
