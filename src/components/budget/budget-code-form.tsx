"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type BudgetCodeFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  nameLabel: string;
  cancelHref: string;
  defaultValues?: { code: string; name: string };
};

export function BudgetCodeForm({
  action,
  nameLabel,
  cancelHref,
  defaultValues,
}: BudgetCodeFormProps) {
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
        <label htmlFor="code" className="text-sm font-medium">
          รหัส
        </label>
        <input
          id="code"
          name="code"
          required
          maxLength={10}
          defaultValue={defaultValues?.code ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          {nameLabel}
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={200}
          defaultValue={defaultValues?.name ?? ""}
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
