"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MailComposeAttachments,
  type PendingAttachment,
} from "@/components/mail/mail-compose-attachments";
import { DistrictClerkCheckboxPicker } from "@/components/mail/district-clerk-checkbox-picker";
import { PersonCheckboxPicker } from "@/components/mail/person-checkbox-picker";
import { SchoolDirectorCheckboxPicker } from "@/components/mail/school-director-checkbox-picker";
import { SchoolStaffCheckboxPicker } from "@/components/mail/school-staff-checkbox-picker";
import {
  WorkgroupCheckboxPicker,
  type WorkgroupCheckboxPickerHandle,
} from "@/components/mail/workgroup-checkbox-picker";
import {
  buildMailComposeFormData,
  toComposeAttachments,
  uploadComposeAttachments,
  validateComposeAttachments,
} from "@/lib/mail/compose-attachments";
import type { MailRecipientCategory } from "@/lib/mail/recipient-options";
import type {
  DistrictClerkGroupOption,
  PersonOption,
  SchoolDirectorGroupOption,
  SchoolStaffGroupOption,
  WorkgroupMemberGroupOption,
} from "@/lib/mail/queries";

type Props = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string; id?: number }>;
  officeName: string;
  people: PersonOption[];
  workgroupMemberGroups: WorkgroupMemberGroupOption[];
  districtClerkGroups: DistrictClerkGroupOption[];
  schoolDirectorGroups: SchoolDirectorGroupOption[];
  schoolStaffGroups: SchoolStaffGroupOption[];
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const panelClass =
  "ml-6 space-y-4 rounded-md border border-border bg-muted/30 p-3";

function CategoryRadio({
  value,
  label,
  hint,
  checked,
  onChange,
}: {
  value: MailRecipientCategory;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: MailRecipientCategory) => void;
}) {
  return (
    <div className="space-y-0.5">
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="radio"
          name="recipientCategory"
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="mt-0.5"
        />
        <span>{label}</span>
      </label>
      {checked && hint ? (
        <p className="ml-6 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function MailComposeForm({
  action,
  officeName,
  people,
  workgroupMemberGroups,
  districtClerkGroups,
  schoolDirectorGroups,
  schoolStaffGroups,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [recipientCategory, setRecipientCategory] =
    useState<MailRecipientCategory>("all");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const workgroupPickerRef = useRef<WorkgroupCheckboxPickerHandle>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setUploadProgress(null);

    const composeAttachments = toComposeAttachments(attachments);
    const attachmentError = validateComposeAttachments(attachments);
    if (attachmentError) {
      setError(attachmentError);
      return;
    }

    if (recipientCategory === "workgroups") {
      const workgroupError = workgroupPickerRef.current?.validate() ?? null;
      if (workgroupError) {
        setError(workgroupError);
        return;
      }
    }

    setLoading(true);
    let documentId: number | undefined;

    try {
      const result = await action(buildMailComposeFormData(e.currentTarget));
      if (!result.ok) {
        setError(result.message ?? "บันทึกไม่สำเร็จ");
        return;
      }
      if (!result.id) {
        setError("บันทึกไม่สำเร็จ");
        return;
      }

      documentId = result.id;

      if (composeAttachments.length > 0) {
        await uploadComposeAttachments(
          documentId,
          composeAttachments,
          (done, total) => setUploadProgress({ done, total }),
        );
      }

      router.push(`/modules/mail/${documentId}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "บันทึกไม่สำเร็จ";
      if (documentId) {
        setError(
          `${message} — จดหมายถูกส่งแล้ว สามารถแนบไฟล์ที่หน้ารายละเอียดได้`,
        );
        router.push(`/modules/mail/${documentId}`);
        router.refresh();
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  }

  function submitLabel() {
    if (!loading) return "ตกลง";
    if (uploadProgress) {
      return `กำลังแนบไฟล์ ${uploadProgress.done}/${uploadProgress.total}...`;
    }
    return "กำลังส่ง...";
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-primary">เขียนจดหมาย</h2>

      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">ถึง</legend>

        <p className="text-xs font-semibold text-muted-foreground">
          {officeName}
        </p>

        <CategoryRadio
          value="all"
          label="บุคลากรทุกคน"
          hint="ส่งถึงบุคลากรทุกคนในระบบ"
          checked={recipientCategory === "all"}
          onChange={setRecipientCategory}
        />

        <CategoryRadio
          value="selected"
          label="บุคลากรบางคน"
          checked={recipientCategory === "selected"}
          onChange={setRecipientCategory}
        />
        {recipientCategory === "selected" ? (
          <div className={panelClass}>
            <PersonCheckboxPicker people={people} />
          </div>
        ) : null}

        <CategoryRadio
          value="district_clerks"
          label="ธุรการกลุ่ม/หน่วย"
          checked={recipientCategory === "district_clerks"}
          onChange={setRecipientCategory}
        />
        {recipientCategory === "district_clerks" ? (
          <div className={panelClass}>
            <DistrictClerkCheckboxPicker groups={districtClerkGroups} />
          </div>
        ) : null}

        <CategoryRadio
          value="workgroups"
          label="กลุ่ม/หน่วย"
          checked={recipientCategory === "workgroups"}
          onChange={setRecipientCategory}
        />
        {recipientCategory === "workgroups" ? (
          <div className={panelClass}>
            <WorkgroupCheckboxPicker
              ref={workgroupPickerRef}
              groups={workgroupMemberGroups}
            />
          </div>
        ) : null}

        <p className="border-t border-border pt-3 text-xs font-semibold text-muted-foreground">
          โรงเรียนในสังกัด {officeName}
        </p>

        <CategoryRadio
          value="school_directors"
          label="ผู้อำนวยการสถานศึกษา"
          checked={recipientCategory === "school_directors"}
          onChange={setRecipientCategory}
        />
        {recipientCategory === "school_directors" ? (
          <div className={panelClass}>
            <SchoolDirectorCheckboxPicker groups={schoolDirectorGroups} />
          </div>
        ) : null}

        <CategoryRadio
          value="school_staff"
          label="ครูและบุคลากรในสถานศึกษา"
          checked={recipientCategory === "school_staff"}
          onChange={setRecipientCategory}
        />
        {recipientCategory === "school_staff" ? (
          <div className={panelClass}>
            <SchoolStaffCheckboxPicker groups={schoolStaffGroups} />
          </div>
        ) : null}
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium">
          เรื่อง
        </label>
        <input
          id="subject"
          name="subject"
          required
          maxLength={150}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="detail" className="text-sm font-medium">
          ข้อความ
        </label>
        <textarea
          id="detail"
          name="detail"
          rows={8}
          className={`${inputClass} min-h-[10rem] py-2`}
        />
      </div>

      <MailComposeAttachments value={attachments} onChange={setAttachments} />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {submitLabel()}
        </Button>
        <Link
          href="/modules/mail/sent"
          className="inline-flex min-h-10 items-center rounded-lg border px-3 text-sm hover:bg-muted"
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
