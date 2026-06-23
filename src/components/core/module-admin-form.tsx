"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UserOption = { id: number; username: string; name: string };
type ModuleOption = { slug: string; name: string };

type ModuleAdminFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string; id?: number } | void>;
  users: UserOption[];
  modules: ModuleOption[];
};

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ModuleAdminForm({ action, users, modules }: ModuleAdminFormProps) {
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
      router.push("/admin/module-admins");
      router.refresh();
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
      <h2 className="text-lg font-semibold text-primary">เพิ่มผู้ดูแลโมดูล</h2>
      <div className="space-y-2">
        <label htmlFor="userId" className="text-sm font-medium">ผู้ใช้</label>
        <select id="userId" name="userId" required className={selectClass} defaultValue="">
          <option value="">เลือกผู้ใช้</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.username} — {u.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="moduleSlug" className="text-sm font-medium">โมดูล</label>
        <select id="moduleSlug" name="moduleSlug" required className={selectClass} defaultValue="">
          <option value="">เลือกโมดูล</option>
          {modules.map((m) => (
            <option key={m.slug} value={m.slug}>{m.name} ({m.slug})</option>
          ))}
        </select>
      </div>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "กำลังบันทึก..." : "บันทึก"}</Button>
        <Link href="/admin/module-admins" className={cn("inline-flex min-h-10 items-center rounded-lg border px-3 text-sm hover:bg-muted")}>ย้อนกลับ</Link>
      </div>
    </form>
  );
}
