"use client";

import Link from "next/link";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { BUDGET_PAY_GROUPS } from "@/lib/budget/constants";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type CodeOption = { code: string; name: string };

type BudgetAllocationFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  plans: CodeOption[];
  projects: CodeOption[];
  keyActivities: CodeOption[];
  moneySources: CodeOption[];
  cancelHref: string;
  showFileUpload?: boolean;
  defaultValues?: {
    recDate: string;
    num: number;
    bookNumber: string;
    bookRef: string;
    plan: string;
    project: string;
    activity: string;
    activity2: string;
    mSource: string;
    mPay: string;
    item: string;
    detail: string;
    money: number;
  };
};

function CodeSelect({
  id,
  label,
  options,
  defaultValue,
  required,
}: {
  id: string;
  label: string;
  options: CodeOption[];
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={id}
        required={required}
        defaultValue={defaultValue ?? ""}
        className={inputClass}
      >
        <option value="">— เลือก —</option>
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.code} {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function BudgetAllocationForm({
  action,
  plans,
  projects,
  keyActivities,
  moneySources,
  cancelHref,
  showFileUpload = true,
  defaultValues,
}: BudgetAllocationFormProps) {
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
          <label htmlFor="num" className="text-sm font-medium">
            งวดที่
          </label>
          <input
            id="num"
            name="num"
            type="number"
            min={0}
            step="1"
            required
            defaultValue={defaultValues?.num ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="bookNumber" className="text-sm font-medium">
            เลขที่หนังสือจัดสรร
          </label>
          <input
            id="bookNumber"
            name="bookNumber"
            maxLength={30}
            defaultValue={defaultValues?.bookNumber ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="bookRef" className="text-sm font-medium">
            อ้างอิงหนังสือ
          </label>
          <input
            id="bookRef"
            name="bookRef"
            maxLength={30}
            defaultValue={defaultValues?.bookRef ?? ""}
            className={inputClass}
          />
        </div>

        <CodeSelect
          id="plan"
          label="แผนงาน"
          options={plans}
          defaultValue={defaultValues?.plan}
          required
        />
        <CodeSelect
          id="project"
          label="ผลผลิต/โครงการ"
          options={projects}
          defaultValue={defaultValues?.project}
        />
        <CodeSelect
          id="activity"
          label="กิจกรรมหลัก"
          options={keyActivities}
          defaultValue={defaultValues?.activity}
        />
        <CodeSelect
          id="mSource"
          label="แหล่งของเงิน"
          options={moneySources}
          defaultValue={defaultValues?.mSource}
        />

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="activity2" className="text-sm font-medium">
            รายละเอียดกิจกรรม
          </label>
          <input
            id="activity2"
            name="activity2"
            required
            maxLength={250}
            defaultValue={defaultValues?.activity2 ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="mPay" className="text-sm font-medium">
            งบรายจ่าย
          </label>
          <select
            id="mPay"
            name="mPay"
            defaultValue={defaultValues?.mPay ?? ""}
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

        <div className="space-y-1">
          <label htmlFor="money" className="text-sm font-medium">
            จำนวนเงินจัดสรร (บาท)
          </label>
          <input
            id="money"
            name="money"
            type="number"
            min={0.01}
            step="0.01"
            required
            defaultValue={defaultValues?.money ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="item" className="text-sm font-medium">
            รายการ
          </label>
          <input
            id="item"
            name="item"
            maxLength={250}
            defaultValue={defaultValues?.item ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="detail" className="text-sm font-medium">
            หมายเหตุ
          </label>
          <input
            id="detail"
            name="detail"
            maxLength={250}
            defaultValue={defaultValues?.detail ?? ""}
            className={inputClass}
          />
        </div>

        {showFileUpload ? (
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="file" className="text-sm font-medium">
              แนบไฟล์หนังสือจัดสรร (ถ้ามี)
            </label>
            <input
              id="file"
              name="file"
              type="file"
              className={cn(inputClass, "py-2")}
            />
          </div>
        ) : null}
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
