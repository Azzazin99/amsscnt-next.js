"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WorkgroupFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  deleteAction?: () => Promise<{ ok: boolean; message?: string }>;
  title: string;
  cancelHref: string;
  mode: "create" | "edit";
  peopleCount?: number;
  registerCount?: number;
  legacyCode?: number | null;
  defaultValues?: {
    name?: string;
    sortOrder?: number;
    active?: boolean;
  };
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function WorkgroupForm({
  action,
  deleteAction,
  title,
  cancelHref,
  mode,
  peopleCount = 0,
  registerCount = 0,
  legacyCode,
  defaultValues,
}: WorkgroupFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasRefs = peopleCount > 0 || registerCount > 0;

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
      if (
        mode === "create" &&
        result &&
        "ok" in result &&
        result.ok &&
        "id" in result &&
        typeof result.id === "number"
      ) {
        router.push(`/admin/workgroups/${result.id}/edit`);
        router.refresh();
        return;
      }
      router.refresh();
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteAction) return;
    if (!window.confirm("ลบกลุ่มงานนี้? การลบไม่สามารถย้อนกลับได้")) {
      return;
    }

    setError(null);
    setDeleting(true);
    try {
      const result = await deleteAction();
      if (!result.ok) {
        setError(result.message ?? "ลบไม่สำเร็จ");
        return;
      }
      router.push("/admin/workgroups");
      router.refresh();
    } catch {
      setError("ลบไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      {mode === "edit" && hasRefs ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          {peopleCount > 0
            ? `มีบุคลากร ${peopleCount.toLocaleString("th-TH")} คน`
            : null}
          {peopleCount > 0 && registerCount > 0 ? " · " : null}
          {registerCount > 0
            ? `ทะเบียนรับ/ส่ง ${registerCount.toLocaleString("th-TH")} รายการ`
            : null}{" "}
          — ลบได้เมื่อไม่มีข้อมูลอ้างอิง
        </p>
      ) : null}

      {mode === "edit" && legacyCode != null ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">รหัส legacy</p>
          <p className="rounded-lg border border-input bg-muted/40 px-3 py-2 font-mono text-sm">
            {legacyCode}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          ชื่อกลุ่มงาน
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={255}
          placeholder="เช่น กลุ่มอำนวยการ"
          defaultValue={defaultValues?.name ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="sortOrder" className="text-sm font-medium">
          ลำดับแสดงผล
        </label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          required
          min={0}
          max={9999}
          defaultValue={defaultValues?.sortOrder ?? 0}
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground">
          ตัวเลขน้อยแสดงก่อน — ใช้ในฟิลเตอร์ทะเบียนรับ/ส่ง
        </p>
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaultValues?.active ?? true}
          className="size-4 rounded border-input"
        />
        เปิดใช้งาน (แสดงในระบบและฟิลเตอร์ทะเบียน)
      </label>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={loading || deleting} className="min-h-11 min-w-28 justify-center">
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
        <Link
          href={cancelHref}
          className={buttonVariants({ variant: "outline", className: "min-h-11 min-w-28 justify-center" })}
        >
          ย้อนกลับ
        </Link>
        {mode === "edit" && deleteAction ? (
          <Button
            type="button"
            variant="destructive"
            disabled={loading || deleting || hasRefs}
            onClick={handleDelete}
            className="min-h-11 min-w-28 justify-center"
          >
            {deleting ? "กำลังลบ..." : "ลบกลุ่มงาน"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
