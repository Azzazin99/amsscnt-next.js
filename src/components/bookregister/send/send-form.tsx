"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import {
  OfficeTypeSelect,
  SecretLevelSelect,
  UrgencyLevelSelect,
} from "@/components/bookregister/regulation-selects";
import { cn } from "@/lib/utils";

export type SendFormDefaults = {
  bookNo?: string;
  bookFrom?: string;
  bookTo?: string;
  signdate?: string;
  subject?: string;
  workgroupId?: number;
  operation?: string;
  comment?: string;
  secretLevel?: number;
  urgencyLevel?: number;
  officeType?: number;
};

type WorkgroupOption = { id: number; name: string };

export type SendFormActionResult =
  | { ok: true; id?: number }
  | { ok: false; message?: string };

type SendFormProps = {
  title: string;
  cancelHref: string;
  workgroups: WorkgroupOption[];
  action: (formData: FormData) => Promise<SendFormActionResult | void>;
  defaultValues?: SendFormDefaults;
  variant?: "district" | "school";
  /** create: แสดง prefix + checkbox เวียน · edit: แก้ไขเลขที่หนังสือได้ */
  mode: "create" | "edit";
  officeNo?: string;
  /** หน้าเพิ่ม: หลังบันทึกสำเร็จไปหน้าแก้ไขเพื่อแนบไฟล์ */
  redirectToEditOnCreate?: boolean;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SendForm({
  title,
  cancelHref,
  workgroups,
  action,
  defaultValues,
  variant = "district",
  mode,
  officeNo,
  redirectToEditOnCreate = false,
}: SendFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSchoolVariant = variant === "school";

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
        redirectToEditOnCreate &&
        result &&
        "ok" in result &&
        result.ok &&
        typeof result.id === "number"
      ) {
        router.push(`/modules/bookregister/send/${result.id}/edit`);
      } else if (mode === "edit" && result && "ok" in result && result.ok) {
        router.refresh();
      } else if (result && "ok" in result && result.ok) {
        router.push(cancelHref);
      }
      router.refresh();
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      <div className="space-y-2">
        <label htmlFor="bookNo" className="text-sm font-medium">
          เลขที่หนังสือ
        </label>
        {mode === "create" ? (
          <div className="space-y-2">
            <span className="inline-block rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm">
              {officeNo || "(ยังไม่ได้ตั้งเลขที่สำนักงาน)"}
              <span className="text-muted-foreground">[เลขรันอัตโนมัติ]</span>
            </span>
            <OfficeTypeSelect
              id="officeType"
              name="officeType"
              label="ประเภทหนังสือ"
              defaultValue={defaultValues?.officeType ?? 1}
            />
          </div>
        ) : (
          <input
            id="bookNo"
            name="bookNo"
            type="text"
            required
            defaultValue={defaultValues?.bookNo ?? ""}
            className={inputClass}
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="signdate" className="text-sm font-medium">
            ลงวันที่
          </label>
          <ThaiDatePicker
            id="signdate"
            name="signdate"
            defaultValue={defaultValues?.signdate ?? ""}
            required
          />
        </div>
        {mode === "edit" ? (
          <OfficeTypeSelect
            id="officeType"
            name="officeType"
            label="ประเภทหนังสือ"
            defaultValue={defaultValues?.officeType ?? 1}
          />
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <UrgencyLevelSelect
          id="urgencyLevel"
          name="urgencyLevel"
          label="ชั้นความเร็ว"
          defaultValue={defaultValues?.urgencyLevel ?? 1}
        />
        <SecretLevelSelect
          id="secretLevel"
          name="secretLevel"
          label="ชั้นความลับ"
          defaultValue={defaultValues?.secretLevel ?? 0}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="bookFrom" className="text-sm font-medium">
          จาก
        </label>
        <input
          id="bookFrom"
          name="bookFrom"
          type="text"
          required
          defaultValue={defaultValues?.bookFrom ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="bookTo" className="text-sm font-medium">
          ถึง
        </label>
        <input
          id="bookTo"
          name="bookTo"
          type="text"
          required
          defaultValue={defaultValues?.bookTo ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium">
          เรื่อง
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          defaultValue={defaultValues?.subject ?? ""}
          className={inputClass}
        />
      </div>

      {isSchoolVariant ? (
        <div className="space-y-2">
          <label htmlFor="operation" className="text-sm font-medium">
            บุคคลปฏิบัติ
          </label>
          <input
            id="operation"
            name="operation"
            type="text"
            defaultValue={defaultValues?.operation ?? ""}
            className={inputClass}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="workgroupId" className="text-sm font-medium">
              กลุ่มปฏิบัติ
            </label>
            <select
              id="workgroupId"
              name="workgroupId"
              required
              defaultValue={defaultValues?.workgroupId ?? ""}
              className={inputClass}
            >
              <option value="">เลือก</option>
              {workgroups.map((wg) => (
                <option key={wg.id} value={wg.id}>
                  {wg.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="operation" className="text-sm font-medium">
              บุคคลปฏิบัติ
            </label>
            <input
              id="operation"
              name="operation"
              type="text"
              defaultValue={defaultValues?.operation ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="comment" className="text-sm font-medium">
          หมายเหตุ
        </label>
        <input
          id="comment"
          name="comment"
          type="text"
          defaultValue={defaultValues?.comment ?? ""}
          className={inputClass}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        แนบไฟล์ (pdf, doc, xls, …) ได้หลังบันทึกรายการ (ในหน้าแก้ไข)
      </p>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={loading} className="min-h-10">
          {loading ? "กำลังบันทึก..." : "ตกลง"}
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
