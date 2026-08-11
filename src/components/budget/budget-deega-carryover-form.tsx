"use client";

import Link from "next/link";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type PayTypeOption = { payTypeId: number; payTypeName: string };
type PlanOption = { id: number; code: string; name: string };
type ProjectOption = { id: number; code: string; name: string };
type ActivityOption = { id: number; code: string; name: string };

type BudgetDeegaCarryoverFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  budgetYear: number;
  payTypes: PayTypeOption[];
  plans: PlanOption[];
  projects: ProjectOption[];
  activities: ActivityOption[];
  cancelHref: string;
};

export function BudgetDeegaCarryoverForm({
  action,
  budgetYear,
  payTypes,
  plans,
  projects,
  activities,
  cancelHref,
}: BudgetDeegaCarryoverFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [withdraw, setWithdraw] = useState<number | "">("");
  const [tax, setTax] = useState<number | "">("");
  const [pay, setPay] = useState<number | "">("");

  const handleWithdrawChange = (val: string) => {
    const w = val === "" ? "" : Number.parseFloat(val) || 0;
    setWithdraw(w);
    if (typeof w === "number") {
      const t = typeof tax === "number" ? tax : 0;
      setPay(Math.max(0, w - t));
    }
  };

  const handleTaxChange = (val: string) => {
    const t = val === "" ? "" : Number.parseFloat(val) || 0;
    setTax(t);
    const w = typeof withdraw === "number" ? withdraw : 0;
    if (typeof t === "number") {
      setPay(Math.max(0, w - t));
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await action(formData);
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
      {/* Header Banner */}
      <div className="text-right border-b pb-4">
        <h2 className="text-xl font-bold text-teal-800 dark:text-teal-400">
          ขอเบิกเงินกันไว้เหลื่อมปี ปีงบประมาณ {budgetYear}
        </h2>
      </div>

      <div className="flex justify-center">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* วันเดือนปี */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="text-right text-sm font-medium">วันเดือนปี</label>
            <div className="w-[200px]">
              <ThaiDatePicker name="recDate" />
            </div>
          </div>

          {/* เลขที่ฎีกา */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="deegaNum" className="text-right text-sm font-medium">
              เลขที่ฎีกา
            </label>
            <input
              id="deegaNum"
              name="deegaNum"
              type="text"
              className={cn(inputClass, "w-[150px]")}
            />
          </div>

          {/* ที่เอกสาร */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="doc" className="text-right text-sm font-medium">
              ที่เอกสาร
            </label>
            <input
              id="doc"
              name="doc"
              type="text"
              required
              className={cn(inputClass, "w-[300px]")}
            />
          </div>

          {/* แผน */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="plan" className="text-right text-sm font-medium">
              แผน
            </label>
            <select id="plan" name="plan" className={inputClass} required defaultValue="">
              <option value="">เลือก</option>
              {plans.map((p) => (
                <option key={p.id} value={`${p.code} ${p.name}`}>
                  {p.code} {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* ผลผลิต/โครงการ */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="project" className="text-right text-sm font-medium">
              ผลผลิต/โครงการ
            </label>
            <select id="project" name="project" className={inputClass} required defaultValue="">
              <option value="">เลือก</option>
              {projects.map((p) => (
                <option key={p.id} value={`${p.code} ${p.name}`}>
                  {p.code} {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* กิจกรรมหลัก */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="activity" className="text-right text-sm font-medium">
              กิจกรรมหลัก
            </label>
            <select id="activity" name="activity" className={inputClass} required defaultValue="">
              <option value="">เลือก</option>
              {activities.map((a) => (
                <option key={a.id} value={`${a.code} ${a.name}`}>
                  {a.code} {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* รายการจ่าย */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="payGroup" className="text-right text-sm font-medium">
              รายการจ่าย
            </label>
            <div className="w-[300px]">
              <select id="payGroup" name="payGroup" className={inputClass} required defaultValue="">
                <option value="">เลือก</option>
                {payTypes.map((pt) => (
                  <option key={pt.payTypeId} value={pt.payTypeId}>
                    {pt.payTypeId} {pt.payTypeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* รายการ */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="item" className="text-right text-sm font-medium">
              รายการ
            </label>
            <input id="item" name="item" type="text" required className={inputClass} />
          </div>

          {/* จำนวนเงินขอเบิก */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="withdraw" className="text-right text-sm font-medium">
              จำนวนเงินขอเบิก
            </label>
            <div className="w-[200px]">
              <input
                id="withdraw"
                name="withdraw"
                type="number"
                step="0.01"
                min="0"
                required
                value={withdraw}
                onChange={(e) => handleWithdrawChange(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* ภาษี */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="tax" className="text-right text-sm font-medium">
              ภาษี
            </label>
            <div className="w-[200px]">
              <input
                id="tax"
                name="tax"
                type="number"
                step="0.01"
                min="0"
                value={tax}
                onChange={(e) => handleTaxChange(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* รับจริง */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="pay" className="text-right text-sm font-medium">
              รับจริง
            </label>
            <div className="w-[200px]">
              <input
                id="pay"
                name="pay"
                type="number"
                step="0.01"
                min="0"
                value={pay || ""}
                onChange={(e) => setPay(e.target.value === "" ? "" : Number.parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Checkbox */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4 pt-2">
            <div />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="saveToReceive"
                name="saveToReceive"
                value="1"
                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <label
                htmlFor="saveToReceive"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                บันทึกข้อมูลในทะเบียนรับเงินงบประมาณด้วย
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4 pt-6">
            <Button type="submit" disabled={loading} className="w-24">
              {loading ? "กำลังบันทึก..." : "ตกลง"}
            </Button>
            <Link
              href={cancelHref}
              className={cn(buttonVariants({ variant: "outline" }), "w-24")}
            >
              ย้อนกลับ
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
