"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type PlanStrategyFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
};

export function PlanStrategyForm({ action }: PlanStrategyFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await action(new FormData(e.currentTarget));
      if (result && "ok" in result && !result.ok) {
        setError(result.message ?? "บันทึกไม่สำเร็จ");
      } else {
        formRef.current?.reset();
      }
    } catch {
      /* redirect throws */
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-4"
    >
      <div className="space-y-1">
        <label htmlFor="idTegic" className="text-xs font-medium">
          รหัส
        </label>
        <input
          id="idTegic"
          name="idTegic"
          required
          maxLength={4}
          className={cn(inputClass, "w-24")}
        />
      </div>
      <div className="min-w-[240px] flex-1 space-y-1">
        <label htmlFor="strategic" className="text-xs font-medium">
          ชื่อยุทธศาสตร์
        </label>
        <input id="strategic" name="strategic" required maxLength={200} className={inputClass} />
      </div>

      {error ? (
        <p className="w-full text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={loading} className="min-h-11">
        {loading ? "กำลังบันทึก…" : "เพิ่มยุทธศาสตร์"}
      </Button>
    </form>
  );
}
