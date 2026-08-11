"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModuleFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  title: string;
  cancelHref: string;
  slug: string;
  defaultValues: {
    name: string;
    sortOrder: number;
    active: boolean;
  };
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ModuleForm({
  action,
  title,
  cancelHref,
  slug,
  defaultValues,
}: ModuleFormProps) {
  const router = useRouter();
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
      <h2 className="text-lg font-semibold text-primary">{title}</h2>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">slug</p>
        <p className={cn(inputClass, "bg-muted/40 font-mono text-sm")}>{slug}</p>
      </div>
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">ชื่อโมดูล</label>
        <input id="name" name="name" required defaultValue={defaultValues.name} className={inputClass} />
      </div>
      <div className="space-y-2">
        <label htmlFor="sortOrder" className="text-sm font-medium">ลำดับ</label>
        <input id="sortOrder" name="sortOrder" type="number" required min={0} defaultValue={defaultValues.sortOrder} className={inputClass} />
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={defaultValues.active} className="size-4 rounded border-input" />
        เปิดใช้งาน (แสดงบน /home)
      </label>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={loading} className="min-h-11 min-w-28 justify-center">{loading ? "กำลังบันทึก..." : "บันทึก"}</Button>
        <Link href={cancelHref} className={buttonVariants({ variant: "outline", className: "min-h-11 min-w-28 justify-center" })}>ย้อนกลับ</Link>
      </div>
    </form>
  );
}
