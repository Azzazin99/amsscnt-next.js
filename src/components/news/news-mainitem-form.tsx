"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NewsMainitemFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  title: string;
  cancelHref: string;
  defaultValues?: { code: number; mainitem: string; itemActive: boolean };
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function NewsMainitemForm({
  action,
  title,
  cancelHref,
  defaultValues,
}: NewsMainitemFormProps) {
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
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      <div className="space-y-2">
        <label htmlFor="code" className="text-sm font-medium">
          รหัส
        </label>
        <input
          id="code"
          name="code"
          type="number"
          required
          defaultValue={defaultValues?.code}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="mainitem" className="text-sm font-medium">
          ชื่อเรื่อง
        </label>
        <input
          id="mainitem"
          name="mainitem"
          required
          maxLength={150}
          defaultValue={defaultValues?.mainitem}
          className={inputClass}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">ใช้งานปัจจุบัน</legend>
        <div className="flex gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="itemActive"
              value="true"
              defaultChecked={defaultValues?.itemActive ?? false}
            />
            ใช่
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="itemActive"
              value="false"
              defaultChecked={defaultValues ? !defaultValues.itemActive : true}
            />
            ไม่ใช่
          </label>
        </div>
      </fieldset>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={loading} className="min-h-11">
          {loading ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
        <Link
          href={cancelHref}
          className={cn(
            "inline-flex min-h-11 items-center rounded-lg border px-4 text-sm hover:bg-muted",
          )}
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
