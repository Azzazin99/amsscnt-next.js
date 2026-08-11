"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DistrictStaffOption, WorkgroupOption } from "@/lib/book/permissions/queries";

type SarabanFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  staffOptions: DistrictStaffOption[];
  workgroupOptions: WorkgroupOption[];
  cancelHref: string;
  defaultValues?: {
    userId: number;
    p1: number;
    p2: number;
  };
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SarabanForm({
  action,
  staffOptions,
  workgroupOptions,
  cancelHref,
  defaultValues,
}: SarabanFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedWorkgroupId, setSelectedWorkgroupId] = useState<number>(
    defaultValues?.p2 || 0,
  );

  const filteredStaffOptions =
    selectedWorkgroupId > 0
      ? staffOptions.filter((s) => s.workgroupId === selectedWorkgroupId)
      : staffOptions;

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
      <h2 className="text-lg font-semibold text-primary">กำหนดสารบรรณ สพท.</h2>
      
      <div className="space-y-4 border rounded-xl p-4 bg-card shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium">เจ้าหน้าที่สารบรรณกลาง สพท.</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="p1" value="0" defaultChecked={defaultValues?.p1 !== 1} className="w-4 h-4 text-primary" />
              <span className="text-sm">ไม่ใช่</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="p1" value="1" defaultChecked={defaultValues?.p1 === 1} className="w-4 h-4 text-primary" />
              <span className="text-sm">ใช่</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="p2" className="text-sm font-medium">เจ้าหน้าที่สารบรรณกลุ่ม</label>
          <select
            id="p2"
            name="p2"
            value={selectedWorkgroupId}
            onChange={(e) => setSelectedWorkgroupId(Number(e.target.value))}
            className={inputClass}
          >
            <option value="0">เลือก</option>
            {workgroupOptions.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="userId" className="text-sm font-medium">
            บุคลากร
          </label>
          <select
            id="userId"
            name="userId"
            required
            defaultValue={defaultValues?.userId || ""}
            className={inputClass}
          >
            <option value="">เลือกบุคลากร</option>
            {filteredStaffOptions.map((staff) => (
              <option key={staff.userId} value={staff.userId}>
                {staff.label}
              </option>
            ))}
          </select>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          หมายเหตุ บุคลากรในสำนักงานให้สามารถเป็นเจ้าหน้าที่สารบรรณกลุ่มได้เพียงกลุ่มเดียวเท่านั้น
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={loading} className="min-w-28">
          {loading ? "กำลังบันทึก..." : "ตกลง"}
        </Button>
        <Link
          href={cancelHref}
          className={cn(buttonVariants({ variant: "outline" }), "min-w-28")}
        >
          ย้อนกลับ
        </Link>
      </div>
    </form>
  );
}
