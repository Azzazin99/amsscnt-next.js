"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DistrictSettingsFormProps = {
  action: (
    formData: FormData,
  ) => Promise<{ ok: boolean; message?: string } | void>;
  defaultOfficeName: string;
  defaultOfficeCode: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function DistrictSettingsForm({
  action,
  defaultOfficeName,
  defaultOfficeCode,
}: DistrictSettingsFormProps) {
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
      <div className="space-y-2">
        <label htmlFor="officeName" className="text-sm font-medium">
          ชื่อหน่วยงาน (เขตพื้นที่การศึกษา)
        </label>
        <input
          id="officeName"
          name="officeName"
          type="text"
          required
          defaultValue={defaultOfficeName}
          placeholder="สำนักงานเขตพื้นที่การศึกษาประถมศึกษาชัยนาท"
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground">
          แสดงบนหัวระบบ หน้าแรก และรายงานทะเบียน
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="officeCode" className="text-sm font-medium">
          รหัสเขตพื้นที่
        </label>
        <input
          id="officeCode"
          name="officeCode"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          required
          defaultValue={defaultOfficeCode}
          placeholder="1701"
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground">
          รหัสเขตในระบบ AMSS (สพป.ชัยนาท = 1701)
        </p>
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
          href="/home"
          className={cn(
            "inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-3 text-sm hover:bg-muted",
          )}
        >
          กลับหน้าแรก
        </Link>
      </div>
    </form>
  );
}
