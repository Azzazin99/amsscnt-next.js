"use client";

import Link from "next/link";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type PayTypeOption = { payTypeId: number; payTypeName: string };
type TypeOption = { typeId: number; typeName: string };
type PersonOption = { personId: string; displayName: string };
type ReferOption = { id: number | string; label: string };

type BudgetPayKindFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  payTypes: PayTypeOption[];
  cancelHref: string;
  budgetYear?: number;
  title?: string;
  types?: TypeOption[];
  people?: PersonOption[];
  withdrawOptions?: ReferOption[];
  deegaOptions?: ReferOption[];
  hideReferences?: boolean;
  defaultValues?: {
    recDate?: string;
    doc?: string;
    item?: string;
    typeId?: number;
    payGroup?: number;
    payAmount?: number;
    payedPerson?: string | null;
    referWdId?: number | string | null;
    referDeegaId?: number | string | null;
  };
};

export function BudgetPayKindForm({
  action,
  payTypes,
  cancelHref,
  budgetYear = 2569,
  title,
  types,
  people = [],
  withdrawOptions = [],
  deegaOptions = [],
  hideReferences = false,
  defaultValues,
}: BudgetPayKindFormProps) {
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
          {title ?? `เพิ่มข้อมูลสั่งจ่ายเงินงบประมาณ ปีงบประมาณ${budgetYear}`}
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
              <ThaiDatePicker
                id="recDate"
                name="recDate"
                defaultValue={defaultValues?.recDate ?? ""}
                required
              />
            </div>
          </div>

          {/* ที่เอกสาร */}
          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] items-center gap-2">
            <label htmlFor="doc" className="text-sm font-medium sm:text-right">
              ที่เอกสาร
            </label>
            <div className="max-w-xs">
              <input
                id="doc"
                name="doc"
                required
                maxLength={30}
                defaultValue={defaultValues?.doc ?? ""}
                className={inputClass}
              />
            </div>
          </div>

          {!hideReferences ? (
            <>
              {/* อ้างอิงทะเบียนขอเบิก/ขอยืมเงิน */}
              <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] items-center gap-2">
                <label htmlFor="referWdId" className="text-sm font-medium sm:text-right">
                  อ้างอิงทะเบียนขอเบิก/ขอยืมเงิน
                </label>
                <div className="max-w-xl">
                  <select
                    id="referWdId"
                    name="referWdId"
                    defaultValue={defaultValues?.referWdId ?? ""}
                    className={inputClass}
                  >
                    <option value="">เลือก</option>
                    {withdrawOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* อ้างอิงเลขที่ฎีกา */}
              <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] items-center gap-2">
                <label htmlFor="referDeegaId" className="text-sm font-medium sm:text-right">
                  อ้างอิงเลขที่ฎีกา
                </label>
                <div className="max-w-md">
                  <select
                    id="referDeegaId"
                    name="referDeegaId"
                    defaultValue={defaultValues?.referDeegaId ?? ""}
                    className={inputClass}
                  >
                    <option value="">เลือก</option>
                    {deegaOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : null}

          {/* ประเภทเงิน (ถ้ามี) */}
          {types ? (
            <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] items-center gap-2">
              <label htmlFor="typeId" className="text-sm font-medium sm:text-right">
                ประเภทของเงิน
              </label>
              <div className="max-w-md">
                <select
                  id="typeId"
                  name="typeId"
                  required
                  defaultValue={defaultValues?.typeId ?? ""}
                  className={inputClass}
                >
                  <option value="">เลือก</option>
                  {types.map((t) => (
                    <option key={t.typeId} value={t.typeId}>
                      {t.typeId} {t.typeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

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
                defaultValue={defaultValues?.item ?? ""}
                className={inputClass}
              />
            </div>
          </div>

          {/* ประเภทรายการจ่าย */}
          {!hideReferences ? (
            <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] items-center gap-2">
              <label htmlFor="payGroup" className="text-sm font-medium sm:text-right">
                ประเภทรายการจ่าย
              </label>
              <div className="max-w-xs">
                <select
                  id="payGroup"
                  name="payGroup"
                  required
                  defaultValue={defaultValues?.payGroup ?? ""}
                  className={inputClass}
                >
                  <option value="">เลือก</option>
                  {payTypes.map((p) => (
                    <option key={p.payTypeId} value={p.payTypeId}>
                      {p.payTypeId} {p.payTypeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

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
                defaultValue={defaultValues?.payAmount ?? ""}
                className={inputClass}
              />
            </div>
          </div>

          {/* ผู้รับเงิน */}
          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] items-center gap-2">
            <label htmlFor="payedPerson" className="text-sm font-medium sm:text-right">
              ผู้รับเงิน
            </label>
            <div className="max-w-md">
              <input
                id="payedPerson"
                name="payedPerson"
                maxLength={50}
                defaultValue={defaultValues?.payedPerson ?? ""}
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

        {/* Buttons */}
        <div className="flex justify-center gap-3 pt-4">
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

