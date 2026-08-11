"use client";

import Link from "next/link";
import { useState } from "react";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type WorkgroupOption = { legacyCode: number; name: string };
type PersonOption = { personId: string; displayName: string };
type StrategyOption = { idTegic: string; strategic: string };

type PlanProjectFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  budgetYear: number;
  workgroups: WorkgroupOption[];
  people: PersonOption[];
  strategies?: StrategyOption[];
  cancelHref: string;
  defaultValues?: {
    codeClus: number;
    codeTegy: string;
    codeProj: string;
    nameProj: string;
    budgetProj: number;
    ownerProj: string;
    beginDate: string;
    finishDate: string;
  };
  suggestedCodeProj?: string;
};

export function PlanProjectForm({
  action,
  budgetYear,
  workgroups,
  people,
  strategies,
  cancelHref,
  defaultValues,
  suggestedCodeProj,
}: PlanProjectFormProps) {
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
      {strategies && strategies.length > 0 ? null : (
        <input type="hidden" name="codeTegy" value={defaultValues?.codeTegy ?? "1"} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {strategies && strategies.length > 0 ? (
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="codeTegy" className="text-sm font-medium">
              ยุทธศาสตร์
            </label>
            <select
              id="codeTegy"
              name="codeTegy"
              required
              defaultValue={defaultValues?.codeTegy ?? ""}
              className={inputClass}
            >
              <option value="">— เลือกยุทธศาสตร์ —</option>
              {strategies.map((s) => (
                <option key={s.idTegic} value={s.idTegic}>
                  {s.idTegic} {s.strategic}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="codeClus" className="text-sm font-medium">
            กลุ่มงาน
          </label>
          <select
            id="codeClus"
            name="codeClus"
            required
            defaultValue={defaultValues?.codeClus ?? ""}
            className={inputClass}
          >
            <option value="">— เลือกกลุ่มงาน —</option>
            {workgroups.map((wg) => (
              <option key={wg.legacyCode} value={wg.legacyCode}>
                {wg.legacyCode} {wg.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="codeProj" className="text-sm font-medium">
            รหัสโครงการ
          </label>
          <input
            id="codeProj"
            name="codeProj"
            required
            maxLength={4}
            defaultValue={defaultValues?.codeProj ?? suggestedCodeProj ?? ""}
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
          <label htmlFor="nameProj" className="text-sm font-medium">
            ชื่อโครงการ
          </label>
          <textarea
            id="nameProj"
            name="nameProj"
            required
            rows={3}
            defaultValue={defaultValues?.nameProj ?? ""}
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
          <label htmlFor="budgetProj" className="text-sm font-medium">
            จำนวนเงินที่จัดสรร (บาท)
          </label>
          <input
            id="budgetProj"
            name="budgetProj"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={defaultValues?.budgetProj ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="ownerProj" className="text-sm font-medium">
            หัวหน้าโครงการ
          </label>
          <select
            id="ownerProj"
            name="ownerProj"
            defaultValue={defaultValues?.ownerProj ?? ""}
            className={inputClass}
          >
            <option value="">— เลือกบุคลากร —</option>
            {people.map((p) => (
              <option key={p.personId} value={p.personId}>
                {p.displayName}
              </option>
            ))}
          </select>
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
