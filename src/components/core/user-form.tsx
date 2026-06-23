"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SchoolOption = { id: number; name: string; schoolCode: string };

type UserFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string; id?: number } | void>;
  title: string;
  cancelHref: string;
  mode: "create" | "edit";
  schools: SchoolOption[];
  defaultValues?: {
    username?: string;
    personId?: string;
    name?: string;
    email?: string;
    organizationType?: "district" | "school";
    schoolId?: number | null;
    isAdmin?: boolean;
    status?: number;
  };
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function UserForm({
  action,
  title,
  cancelHref,
  mode,
  schools,
  defaultValues,
}: UserFormProps) {
  const router = useRouter();
  const [orgType, setOrgType] = useState<"district" | "school">(
    defaultValues?.organizationType ?? "district",
  );
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
      if (mode === "create" && result && "ok" in result && result.ok && "id" in result && typeof result.id === "number") {
        router.push(`/admin/users/${result.id}/edit`);
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

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">Username</label>
        {mode === "create" ? (
          <input id="username" name="username" required maxLength={100} className={inputClass} />
        ) : (
          <>
            <input type="hidden" name="username" value={defaultValues?.username ?? ""} />
            <p className={cn(inputClass, "bg-muted/40 font-mono")}>{defaultValues?.username}</p>
          </>
        )}
      </div>

      {mode === "create" ? (
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">รหัสผ่าน</label>
          <input id="password" name="password" type="password" required minLength={6} className={inputClass} />
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">รหัสผ่านใหม่ (ว่าง = ไม่เปลี่ยน)</label>
          <input id="password" name="password" type="password" minLength={6} className={inputClass} />
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="personId" className="text-sm font-medium">เลขบัตรประชาชน</label>
        <input id="personId" name="personId" required maxLength={13} defaultValue={defaultValues?.personId ?? ""} className={inputClass} />
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">ชื่อแสดง</label>
        <input id="name" name="name" required defaultValue={defaultValues?.name ?? ""} className={inputClass} />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">อีเมล</label>
        <input id="email" name="email" type="email" required defaultValue={defaultValues?.email ?? ""} className={inputClass} />
      </div>

      <div className="space-y-2">
        <label htmlFor="organizationType" className="text-sm font-medium">ระดับ</label>
        <select
          id="organizationType"
          name="organizationType"
          required
          value={orgType}
          onChange={(e) => setOrgType(e.target.value as "district" | "school")}
          className={inputClass}
        >
          <option value="district">เขตพื้นที่</option>
          <option value="school">โรงเรียน</option>
        </select>
      </div>

      {orgType === "school" ? (
        <div className="space-y-2">
          <label htmlFor="schoolId" className="text-sm font-medium">สถานศึกษา</label>
          <select id="schoolId" name="schoolId" required defaultValue={defaultValues?.schoolId ?? ""} className={inputClass}>
            <option value="">เลือก</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.schoolCode} — {s.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="schoolId" value="" />
      )}

      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">สถานะ</label>
        <select id="status" name="status" defaultValue={String(defaultValues?.status ?? 1)} className={inputClass}>
          <option value="1">ใช้งาน</option>
          <option value="0">ปิด</option>
        </select>
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" name="isAdmin" defaultChecked={defaultValues?.isAdmin ?? false} className="size-4 rounded border-input" />
        ผู้ดูแลระบบ (จัดการระบบ)
      </label>

      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "กำลังบันทึก..." : "บันทึก"}</Button>
        <Link href={cancelHref} className="inline-flex min-h-10 items-center rounded-lg border px-3 text-sm hover:bg-muted">ย้อนกลับ</Link>
      </div>
    </form>
  );
}
