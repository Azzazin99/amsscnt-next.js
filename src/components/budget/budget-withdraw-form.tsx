"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type PayTypeOption = { payTypeId: number; payTypeName: string };
type PersonOption = { personId: string; displayName: string };
type ProjectOption = { id: number; code: string; name: string };
type ActivityOption = { id: number; code: string; name: string; codeProj?: string };

type BudgetWithdrawFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  budgetYear?: number;
  payTypes: PayTypeOption[];
  people: PersonOption[];
  projects?: ProjectOption[];
  activities?: ActivityOption[];
  cancelHref: string;
  defaultValues?: {
    recDate?: string;
    document?: string;
    item?: string;
    project?: string;
    activity?: string;
    pjActivity?: string;
    money?: number;
    payType?: number;
    pRequest?: string;
    borrowStatus?: number;
    requestType?: string;
  };
};

export function BudgetWithdrawForm({
  action,
  budgetYear = 2569,
  payTypes,
  people,
  projects = [],
  activities = [],
  cancelHref,
  defaultValues,
}: BudgetWithdrawFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [requestType, setRequestType] = useState<string>(
    defaultValues?.requestType ??
      (defaultValues?.borrowStatus === 1 ? "borrow_budget" : "disburse"),
  );
  const [projectSearch, setProjectSearch] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>(defaultValues?.project ?? "");

  const filteredProjects = projects.filter(
    (p) =>
      !projectSearch ||
      p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(projectSearch.toLowerCase()),
  );

  const selectedProjectCode = selectedProject.split(" ")[0];
  const filteredActivities = activities.filter(
    (a) => !selectedProjectCode || !a.codeProj || a.codeProj === selectedProjectCode,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      // Map requestType to borrowStatus
      const isBorrow = requestType.startsWith("borrow");
      formData.set("borrowStatus", isBorrow ? "1" : "0");
      formData.set("requestType", requestType);

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
      <div className="text-center border-b pb-4">
        <h2 className="text-xl font-bold text-teal-800 dark:text-teal-400">
          ลงทะเบียน หลักฐานขอเบิก/ขอยืมเงิน ปีงบประมาณ {budgetYear}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr] items-center">
            {/* วันเดือนปี */}
            <label htmlFor="recDate" className="text-sm font-semibold text-foreground sm:text-right">
              วันเดือนปี
            </label>
            <div className="max-w-[220px]">
              <ThaiDatePicker
                id="recDate"
                name="recDate"
                defaultValue={defaultValues?.recDate ?? ""}
                required
              />
            </div>

            {/* ที่เอกสาร */}
            <label htmlFor="document" className="text-sm font-semibold text-foreground sm:text-right">
              ที่เอกสาร
            </label>
            <div className="max-w-md">
              <input
                id="document"
                name="document"
                required
                maxLength={30}
                defaultValue={defaultValues?.document ?? ""}
                className={inputClass}
              />
            </div>

            {/* Radio Group ประเภทการเบิก/ยืม */}
            <div className="sm:col-start-2 space-y-2 py-1">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="requestTypeRadio"
                  value="borrow_budget"
                  checked={requestType === "borrow_budget"}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="size-4 text-teal-600 border-input focus:ring-teal-500"
                />
                <span>ขอยืมเงินงบประมาณ</span>
              </label>

              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="requestTypeRadio"
                  value="borrow_off_budget"
                  checked={requestType === "borrow_off_budget"}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="size-4 text-teal-600 border-input focus:ring-teal-500"
                />
                <span>ขอยืมเงินนอกงบประมาณ</span>
              </label>

              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="requestTypeRadio"
                  value="borrow_advance"
                  checked={requestType === "borrow_advance"}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="size-4 text-teal-600 border-input focus:ring-teal-500"
                />
                <span>ขอยืมเงินทดรองราชการ</span>
              </label>

              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="requestTypeRadio"
                  value="disburse"
                  checked={requestType === "disburse"}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="size-4 text-teal-600 border-input focus:ring-teal-500"
                />
                <span>ขอเบิก</span>
              </label>
            </div>

            {/* รายการ */}
            <label htmlFor="item" className="text-sm font-semibold text-foreground sm:text-right self-start mt-2">
              รายการ
            </label>
            <div>
              <textarea
                id="item"
                name="item"
                rows={3}
                required
                maxLength={250}
                defaultValue={defaultValues?.item ?? ""}
                className={cn(inputClass, "h-auto py-2")}
              />
            </div>

            {/* โครงการ + ค้นหา */}
            <label htmlFor="project" className="text-sm font-semibold text-foreground sm:text-right">
              โครงการ
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                id="project"
                name="project"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className={cn(inputClass, "w-full max-w-xl")}
              >
                <option value="">เลือก</option>
                {filteredProjects.map((p) => {
                  const label = p.code ? `${p.code} ${p.name}` : p.name;
                  return (
                    <option key={p.id} value={label}>
                      {label}
                    </option>
                  );
                })}
              </select>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">ค้นหา</span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อโครงการ..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className={cn(inputClass, "h-9 w-40 text-xs pr-7")}
                  />
                  <Search className="size-3.5 absolute right-2 top-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* กิจกรรม */}
            <label htmlFor="activity" className="text-sm font-semibold text-foreground sm:text-right">
              กิจกรรม
            </label>
            <div>
              <select
                id="activity"
                name="pjActivity"
                className={cn(inputClass, "max-w-xl")}
              >
                {!selectedProject ? (
                  <option value="">เลือกโครงการก่อน</option>
                ) : (
                  <>
                    <option value="">เลือก</option>
                    {filteredActivities.map((a) => {
                      const label = a.code ? `${a.code} ${a.name}` : a.name;
                      return (
                        <option key={a.id} value={label}>
                          {label}
                        </option>
                      );
                    })}
                  </>
                )}
              </select>
            </div>

            {/* จำนวนเงิน */}
            <label htmlFor="money" className="text-sm font-semibold text-foreground sm:text-right">
              จำนวนเงิน
            </label>
            <div className="flex items-center gap-2">
              <input
                id="money"
                name="money"
                type="number"
                min={0.01}
                step="0.01"
                required
                defaultValue={defaultValues?.money ?? ""}
                className={cn(inputClass, "max-w-[200px] font-mono font-semibold")}
              />
              <span className="text-sm font-medium text-muted-foreground">บาท</span>
            </div>

            {/* ประเภทรายการจ่าย */}
            <label htmlFor="payType" className="text-sm font-semibold text-foreground sm:text-right">
              ประเภทรายการจ่าย
            </label>
            <div className="max-w-xl">
              <select
                id="payType"
                name="payType"
                defaultValue={defaultValues?.payType ?? ""}
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

            {/* ชื่อผู้ขอเบิก/ขอยืมเงิน */}
            <label htmlFor="pRequest" className="text-sm font-semibold text-foreground sm:text-right">
              ชื่อผู้ขอเบิก/ขอยืมเงิน
            </label>
            <div className="max-w-xl">
              <select
                id="pRequest"
                name="pRequest"
                defaultValue={defaultValues?.pRequest ?? ""}
                className={inputClass}
              >
                <option value="">— เลือกบุคลากร —</option>
                {people.map((p) => (
                  <option key={p.personId} value={p.displayName}>
                    {p.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive font-medium text-center" role="alert">
            {error}
          </p>
        ) : null}

        {/* Buttons (Bottom Right) */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="min-h-10 px-6 font-semibold bg-teal-700 hover:bg-teal-800 text-white shadow-xs"
          >
            {loading ? "กำลังบันทึก…" : "ตกลง"}
          </Button>
          <Link
            href={cancelHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "min-h-10 px-6 font-semibold border-input shadow-xs",
            )}
          >
            ย้อนกลับ
          </Link>
        </div>
      </form>
    </section>
  );
}
