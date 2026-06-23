"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { SchoolCombobox } from "@/components/bookregister/school-combobox";
import {
  RecordTypeSelect,
  SecretLevelSelect,
  UrgencyLevelSelect,
} from "@/components/bookregister/regulation-selects";
import { fetchReceiveBookNoPrefix } from "@/lib/bookregister/receive/actions";
import { cn } from "@/lib/utils";

export type ReceiveFormDefaults = {
  schoolCode?: string;
  bookFrom?: string;
  bookNo?: string;
  signdate?: string;
  bookTo?: string;
  subject?: string;
  workgroupId?: number;
  operation?: string;
  comment?: string;
  urgencyLevel?: number;
  secretLevel?: number;
  recordType?: number;
  fromBookModule?: boolean;
  bookLink?: number;
};

type SchoolOption = { code: string; name: string };
type WorkgroupOption = { id: number; name: string };

export type ReceiveFormActionResult =
  | { ok: true; id?: number; message?: string }
  | { ok: false; message?: string }
  | void;

type ReceiveFormProps = {
  title: string;
  cancelHref: string;
  schools: SchoolOption[];
  workgroups: WorkgroupOption[];
  action: (formData: FormData) => Promise<ReceiveFormActionResult>;
  defaultValues?: ReceiveFormDefaults;
  variant?: "district" | "school";
  /** หน้าเพิ่ม: เติม prefix เลขที่หนังสือเมื่อเลือกโรงเรียน */
  suggestBookNoOnSchoolChange?: boolean;
  /** หน้าเพิ่ม: หลังบันทึกสำเร็จไปหน้าแก้ไขเพื่อแนบไฟล์ */
  redirectToEditOnCreate?: boolean;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const DEFAULT_BOOK_TO = "สำนักงานเขตพื้นที่การศึกษา";

export function ReceiveForm({
  title,
  cancelHref,
  schools,
  workgroups,
  action,
  defaultValues,
  variant = "district",
  suggestBookNoOnSchoolChange = false,
  redirectToEditOnCreate = false,
}: ReceiveFormProps) {
  const router = useRouter();
  const initialSchool = defaultValues?.schoolCode ?? "";
  const [schoolCode, setSchoolCode] = useState(initialSchool);
  const [bookNo, setBookNo] = useState(defaultValues?.bookNo ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!suggestBookNoOnSchoolChange) return;
    if (!schoolCode || schoolCode === "other") return;

    let cancelled = false;
    void (async () => {
      const result = await fetchReceiveBookNoPrefix(schoolCode);
      if (cancelled || !result.ok) return;
      if (result.prefix) setBookNo(result.prefix);
    })();

    return () => {
      cancelled = true;
    };
  }, [schoolCode, suggestBookNoOnSchoolChange]);

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
        router.push(`/modules/bookregister/receive/${result.id}/edit`);
      } else {
        router.push(cancelHref);
      }
      router.refresh();
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const isSchoolVariant = variant === "school";
  const showCustomFrom = isSchoolVariant || schoolCode === "other";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>

      {isSchoolVariant ? (
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
      ) : (
        <>
          <div className="space-y-2">
            <label id="schoolCode-label" htmlFor="schoolCode" className="text-sm font-medium">
              จาก (เลือกโรงเรียน)
            </label>
            <SchoolCombobox
              id="schoolCode"
              labelId="schoolCode-label"
              name="schoolCode"
              schools={schools}
              value={schoolCode}
              onChange={setSchoolCode}
            />
          </div>

          {showCustomFrom ? (
            <div className="space-y-2">
              <label htmlFor="bookFrom-district" className="text-sm font-medium">
                ระบุจาก
              </label>
              <input
                id="bookFrom-district"
                name="bookFrom"
                type="text"
                defaultValue={defaultValues?.bookFrom ?? ""}
                className={inputClass}
              />
            </div>
          ) : (
            <input type="hidden" name="bookFrom" value="" />
          )}
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="bookNo" className="text-sm font-medium">
            เลขที่หนังสือ
          </label>
          <input
            id="bookNo"
            name="bookNo"
            type="text"
            required
            value={bookNo}
            onChange={(e) => setBookNo(e.target.value)}
            className={inputClass}
          />
        </div>
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
          defaultValue={defaultValues?.bookTo ?? DEFAULT_BOOK_TO}
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
          defaultValue={defaultValues?.comment ?? "เอกสารกระดาษ"}
          className={inputClass}
        />
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

      {defaultValues?.fromBookModule ? (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
          รายการนี้มาจากระบบรับส่งหนังสือ
          {defaultValues.bookLink
            ? ` (อ้างอิง #${defaultValues.bookLink})`
            : ""}
        </p>
      ) : (
        <RecordTypeSelect
          id="recordType"
          name="recordType"
          defaultValue={defaultValues?.recordType ?? 1}
        />
      )}

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
