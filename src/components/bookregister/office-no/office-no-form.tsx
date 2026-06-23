"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OfficeNoFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  defaultOfficeNo?: string;
  title: string;
  cancelHref: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function OfficeNoForm({
  action,
  defaultOfficeNo = "",
  title,
  cancelHref,
}: OfficeNoFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await action(formData);
      if (result && "ok" in result && !result.ok) {
        setError(result.message ?? "บันทึกไม่สำเร็จ");
        return;
      }
      router.refresh();
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      <p className="text-sm text-muted-foreground">
        ใช้เป็น prefix เลขที่หนังสือออกของสำนักงานเขต เช่น{" "}
        <span className="font-medium text-foreground">ที่ ศธ 04146/</span> ตามด้วย
        เลขรันอัตโนมัติ (หรือ ว สำหรับหนังสือเวียน)
      </p>

      <div className="space-y-2">
        <label htmlFor="officeNo" className="text-sm font-medium">
          เลขที่สำนักงาน (prefix)
        </label>
        <input
          id="officeNo"
          name="officeNo"
          type="text"
          required
          defaultValue={defaultOfficeNo}
          placeholder="ที่ ศธ 04146/"
          className={inputClass}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={loading} className="min-h-10">
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
        <Link
          href={cancelHref}
          className={cn(
            "inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-3 text-sm hover:bg-muted",
          )}
        >
          ย้อนกลับ
        </Link>
      </div>
    </form>
  );
}
