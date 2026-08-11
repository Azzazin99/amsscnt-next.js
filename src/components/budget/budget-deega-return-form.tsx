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
type ActivityOption = { id: number; code: string; name: string; codeProj?: string };
type ReceiveOption = { num: number; bookNumber: string | null; item: string | null };

type BudgetDeegaReturnFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  budgetYear: number;
  payTypes: PayTypeOption[];
  plans: PlanOption[];
  projects: ProjectOption[];
  activities: ActivityOption[];
  receives: ReceiveOption[];
  cancelHref: string;
};

export function BudgetDeegaReturnForm({
  action,
  budgetYear,
  payTypes,
  plans,
  projects,
  activities,
  receives,
  cancelHref,
}: BudgetDeegaReturnFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");

  const filteredProjects = projects;

  const filteredActivities = activities;

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
          คืนเงินคงคลัง ปีงบประมาณ {budgetYear}
        </h2>
      </div>

      <div className="flex justify-center">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="text-right text-sm font-medium">วันเดือนปี</label>
            <div className="w-[200px]">
              <ThaiDatePicker name="recDate" />
            </div>
          </div>

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

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="receiveNum" className="text-right text-sm font-medium">
              เลขที่ใบงวด
            </label>
            <select id="receiveNum" name="receiveNum" className={inputClass} required>
              <option value="">เลือก</option>
              <option value="other">อื่นๆ</option>
              <option value="salary">เงินเดือน</option>
              <option value="medical">งบกลางค่ารักษาพยาบาล</option>
              <option value="tuition">งบกลางค่าการศึกษาบุตร</option>
              {receives.map((r) => (
                <option key={r.num} value={r.num}>
                  {r.num} {r.item || ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="plan" className="text-right text-sm font-medium">
              แผน
            </label>
            <select
              id="plan"
              name="plan"
              className={inputClass}
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              required
            >
              <option value="">เลือก</option>
              {plans.map((p) => (
                <option key={p.id} value={`${p.code} ${p.name}`}>
                  {p.code} {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="project" className="text-right text-sm font-medium">
              ผลผลิต/โครงการ
            </label>
            <select
              id="project"
              name="project"
              className={inputClass}
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              required
            >
              <option value="">เลือก</option>
              {filteredProjects.map((p) => (
                <option key={p.id} value={`${p.code} ${p.name}`}>
                  {p.code} {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="activity" className="text-right text-sm font-medium">
              กิจกรรมหลัก
            </label>
            <select id="activity" name="activity" className={inputClass} required>
              <option value="">เลือก</option>
              {filteredActivities.map((a) => (
                <option key={a.id} value={`${a.code} ${a.name}`}>
                  {a.code} {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="payGroup" className="text-right text-sm font-medium">
              รายการจ่าย
            </label>
            <div className="w-[300px]">
              <select id="payGroup" name="payGroup" className={inputClass} required>
                <option value="">เลือก</option>
                {payTypes.map((pt) => (
                  <option key={pt.payTypeId} value={pt.payTypeId}>
                    {pt.payTypeId} {pt.payTypeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="item" className="text-right text-sm font-medium">
              รายการ
            </label>
            <input id="item" name="item" type="text" required className={inputClass} />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label htmlFor="amount" className="text-right text-sm font-medium">
              จำนวนเงินคืน
            </label>
            <div className="w-[200px]">
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4 pt-2">
            <div />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="saveToMain"
                name="saveToMain"
                value="1"
                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <label
                htmlFor="saveToMain"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                บันทึกข้อมูลในทะเบียนสั่งจ่ายเงินงบประมาณด้วย
              </label>
            </div>
          </div>

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
