"use client";

import Link from "next/link";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type ProjectOption = {
  codeProj: string;
  nameProj: string;
  codeClus: number;
};

type PlanActivityFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  budgetYear: number;
  projects: ProjectOption[];
  cancelHref: string;
  defaultValues?: {
    codeClus: number;
    codeProj: string;
    codeActi: string;
    nameActi: string;
    budgetActi: number;
    beginDate: string;
    finishDate: string;
  };
  initialCodeProj?: string;
};

export function PlanActivityForm({
  action,
  budgetYear,
  projects,
  cancelHref,
  defaultValues,
  initialCodeProj,
}: PlanActivityFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProj, setSelectedProj] = useState(
    defaultValues?.codeProj ?? initialCodeProj ?? "",
  );

  const selectedProject = projects.find((p) => p.codeProj === selectedProj);

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
      <input
        type="hidden"
        name="codeClus"
        value={selectedProject?.codeClus ?? defaultValues?.codeClus ?? ""}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="codeProj" className="text-sm font-medium">
            โครงการ
          </label>
          <select
            id="codeProj"
            name="codeProj"
            required
            value={selectedProj}
            onChange={(e) => setSelectedProj(e.target.value)}
            className={inputClass}
          >
            <option value="">— เลือกโครงการ —</option>
            {projects.map((p) => (
              <option key={p.codeProj} value={p.codeProj}>
                {p.codeProj} {p.nameProj}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="codeActi" className="text-sm font-medium">
            รหัสกิจกรรม
          </label>
          <input
            id="codeActi"
            name="codeActi"
            required
            maxLength={6}
            defaultValue={defaultValues?.codeActi ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">ปีงบประมาณ</label>
          <input
            readOnly
            value={budgetYear}
            className={cn(inputClass, "bg-muted")}
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="nameActi" className="text-sm font-medium">
            ชื่อกิจกรรม
          </label>
          <textarea
            id="nameActi"
            name="nameActi"
            required
            rows={3}
            defaultValue={defaultValues?.nameActi ?? ""}
            className={cn(inputClass, "min-h-[80px] py-2")}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="beginDate" className="text-sm font-medium">
            วันเริ่มต้น
          </label>
          <ThaiDatePicker
            id="beginDate"
            name="beginDate"
            defaultValue={defaultValues?.beginDate ?? ""}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="finishDate" className="text-sm font-medium">
            วันสิ้นสุด
          </label>
          <ThaiDatePicker
            id="finishDate"
            name="finishDate"
            defaultValue={defaultValues?.finishDate ?? ""}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="budgetActi" className="text-sm font-medium">
            จำนวนเงิน (บาท)
          </label>
          <input
            id="budgetActi"
            name="budgetActi"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={defaultValues?.budgetActi ?? ""}
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
        <Button type="submit" disabled={loading} className="min-h-11">
          {loading ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
        <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
