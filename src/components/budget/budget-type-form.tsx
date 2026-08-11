"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type BudgetTypeFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  cancelHref: string;
  defaultValues?: { categoryId: number; typeId: number; typeName: string };
};

export function BudgetTypeForm({
  action,
  cancelHref,
  defaultValues,
}: BudgetTypeFormProps) {
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <div className="space-y-1">
        <label htmlFor="categoryId" className="text-sm font-medium">
          ประเภท(หลัก)ของเงิน
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={defaultValues?.categoryId ?? ""}
          className={inputClass}
        >
          <option value="">— เลือก —</option>
          <option value="1">เงินนอกงบประมาณ (1)</option>
          <option value="3">เงินรายได้แผ่นดิน (3)</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="typeId" className="text-sm font-medium">
          รหัสประเภท(ย่อย)ของเงิน (3 หลัก)
        </label>
        <input
          id="typeId"
          name="typeId"
          type="number"
          min={100}
          max={399}
          required
          defaultValue={defaultValues?.typeId ?? ""}
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground">
          เลขหลักแรกต้องตรงกับประเภทหลัก เช่น 101, 301
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="typeName" className="text-sm font-medium">
          ชื่อประเภท(ย่อย)ของเงิน
        </label>
        <input
          id="typeName"
          name="typeName"
          required
          maxLength={100}
          defaultValue={defaultValues?.typeName ?? ""}
          className={inputClass}
        />
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
