"use client";

import { FileText, Paperclip } from "lucide-react";
import type { RefObject } from "react";
import { FieldError } from "@/components/shared/field-error";
import { LeaveRequestLetterPreview } from "@/components/leave/leave-request-letter-preview";
import {
  LEAVE_ATTACHMENT_ACCEPT,
  LEAVE_FORM_INLINE_INPUT_CLASS,
  LEAVE_FORM_INPUT_CLASS,
  withFieldError,
} from "@/components/leave/leave-request-form-shared";
import type {
  LastLeaveInfo,
  LeaveApproverOption,
  LeaveRequesterProfile,
} from "@/lib/leave/form-context-shared";
import type { HalfDayPeriod } from "@/lib/leave/regulation/types";
import { cn } from "@/lib/utils";

type LeaveRequestFormSectionDetailsProps = {
  officeName: string;
  requester: LeaveRequesterProfile;
  leaveType: string;
  leaveStart: string;
  leaveFinish: string;
  leaveTotal: number;
  halfDayPeriod: HalfDayPeriod | null;
  lastLeave: LastLeaveInfo | null;
  writeAt: string;
  onWriteAtChange: (value: string) => void;
  because: string;
  onBecauseChange: (value: string) => void;
  contact: string;
  onContactChange: (value: string) => void;
  contactTel: string;
  onContactTelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContactTelPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  jobPersonOptions: LeaveApproverOption[];
  initialJobPersonId: string | null;
  attachmentVisible: boolean;
  attachmentRequired: boolean;
  attachmentHint: string | null;
  pendingFileName: string | null;
  existingAttachmentName: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onOpenFilePicker: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  fieldErrors: Record<string, string>;
};

export function LeaveRequestFormSectionDetails({
  officeName,
  requester,
  leaveType,
  leaveStart,
  leaveFinish,
  leaveTotal,
  halfDayPeriod,
  lastLeave,
  writeAt,
  onWriteAtChange,
  because,
  onBecauseChange,
  contact,
  onContactChange,
  contactTel,
  onContactTelChange,
  onContactTelPaste,
  jobPersonOptions,
  initialJobPersonId,
  attachmentVisible,
  attachmentRequired,
  attachmentHint,
  pendingFileName,
  existingAttachmentName,
  fileInputRef,
  onOpenFilePicker,
  onFileChange,
  onClearFile,
  fieldErrors,
}: LeaveRequestFormSectionDetailsProps) {
  const hasContactError = Boolean(
    fieldErrors.contact || fieldErrors.contactTel,
  );
  const hasAttachmentError = Boolean(fieldErrors.attachment);
  const hasJobError = Boolean(fieldErrors.jobPersonId);

  return (
    <div className="space-y-6 border-t pt-6">
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium">เหตุผลการลา</legend>

        <div className="space-y-2">
          <label htmlFor="because" className="text-sm font-medium">
            เนื่องจาก <span className="text-destructive">*</span>
          </label>
          <textarea
            id="because"
            name="because"
            maxLength={250}
            rows={3}
            value={because}
            onChange={(e) => onBecauseChange(e.target.value)}
            aria-invalid={fieldErrors.because ? true : undefined}
            className={withFieldError(
              "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              fieldErrors,
              "because",
            )}
            placeholder="ระบุเหตุผลการลา"
          />
          <FieldError message={fieldErrors.because} />
        </div>

        <div className="space-y-2">
          <label htmlFor="writeAt" className="text-sm font-medium">
            เขียนที่ (ไม่บังคับ)
          </label>
          <input
            id="writeAt"
            name="writeAt"
            maxLength={100}
            value={writeAt}
            onChange={(e) => onWriteAtChange(e.target.value)}
            aria-invalid={fieldErrors.writeAt ? true : undefined}
            className={withFieldError(
              cn(LEAVE_FORM_INLINE_INPUT_CLASS, "w-full"),
              fieldErrors,
              "writeAt",
            )}
            placeholder="เช่น สำนักงานเขตพื้นที่การศึกษา..."
          />
          <FieldError message={fieldErrors.writeAt} />
        </div>
      </fieldset>

      <details
        className="rounded-lg border"
        open={hasContactError || Boolean(contact.trim() || contactTel.trim())}
      >
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
          ข้อมูลติดต่อ (ไม่บังคับ)
        </summary>
        <div className="space-y-3 border-t px-4 py-3">
          <div className="space-y-2">
            <label htmlFor="contact" className="text-sm font-medium">
              ระหว่างลาติดต่อได้ที่
            </label>
            <input
              id="contact"
              name="contact"
              maxLength={150}
              value={contact}
              onChange={(e) => onContactChange(e.target.value)}
              aria-invalid={fieldErrors.contact ? true : undefined}
              className={withFieldError(
                cn(LEAVE_FORM_INLINE_INPUT_CLASS, "w-full"),
                fieldErrors,
                "contact",
              )}
            />
            <FieldError message={fieldErrors.contact} />
          </div>
          <div className="space-y-2">
            <label htmlFor="contactTel" className="text-sm font-medium">
              เบอร์โทรศัพท์
            </label>
            <input
              id="contactTel"
              name="contactTel"
              type="text"
              inputMode="numeric"
              pattern="0[689][0-9]{8}"
              maxLength={10}
              value={contactTel}
              aria-invalid={fieldErrors.contactTel ? true : undefined}
              aria-describedby={
                fieldErrors.contactTel
                  ? "contactTel-hint contactTel-error"
                  : "contactTel-hint"
              }
              className={withFieldError(
                cn(LEAVE_FORM_INLINE_INPUT_CLASS, "w-full"),
                fieldErrors,
                "contactTel",
              )}
              onChange={onContactTelChange}
              onPaste={onContactTelPaste}
            />
            <p id="contactTel-hint" className="text-xs text-muted-foreground">
              รูปแบบ 08 xxxx xxxx
            </p>
            <FieldError
              id="contactTel-error"
              message={fieldErrors.contactTel}
            />
          </div>
        </div>
      </details>

      {attachmentVisible ? (
        <details
          className={cn(
            "rounded-lg border",
            hasAttachmentError && "border-destructive",
          )}
          open={attachmentRequired || hasAttachmentError}
        >
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
            เอกสารแนบ {attachmentRequired ? "(บังคับ)" : "(ถ้ามี)"}
          </summary>
          <div className="space-y-3 border-t px-4 py-3">
            {attachmentHint ? (
              <p className="text-sm text-muted-foreground">{attachmentHint}</p>
            ) : null}
            <input
              ref={fileInputRef}
              id="attachment"
              name="attachment"
              type="file"
              accept={LEAVE_ATTACHMENT_ACCEPT}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={onFileChange}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenFilePicker}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border bg-secondary px-3 text-sm font-medium hover:bg-secondary/80"
              >
                <Paperclip className="size-4" aria-hidden />
                {pendingFileName ? "เปลี่ยนไฟล์แนบ" : "เลือกไฟล์แนบ"}
              </button>
              {pendingFileName ? (
                <button
                  type="button"
                  onClick={onClearFile}
                  className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm hover:bg-muted"
                >
                  ล้างไฟล์
                </button>
              ) : null}
            </div>
            {pendingFileName ? (
              <p className="text-sm">
                เลือกแล้ว:{" "}
                <span className="font-medium">{pendingFileName}</span>
              </p>
            ) : existingAttachmentName ? (
              <p className="text-sm">
                ไฟล์เดิม:{" "}
                <span className="font-medium">{existingAttachmentName}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {attachmentRequired
                  ? "ยังไม่ได้เลือกไฟล์ (บังคับแนบ)"
                  : "ยังไม่ได้เลือกไฟล์"}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              รองรับ PDF และรูปภาพ
            </p>
            <FieldError message={fieldErrors.attachment} />
          </div>
        </details>
      ) : null}

      <details
        className="rounded-lg border"
        open={hasJobError || Boolean(initialJobPersonId)}
      >
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
          มอบงานระหว่างลา (ไม่บังคับ)
        </summary>
        <div className="space-y-2 border-t px-4 py-3">
          <label htmlFor="jobPersonId" className="text-sm text-muted-foreground">
            ผู้รับมอบงาน — ผู้รับจะเห็นในเมนู รับมอบงาน
          </label>
          <select
            id="jobPersonId"
            name="jobPersonId"
            defaultValue={initialJobPersonId ?? ""}
            aria-invalid={fieldErrors.jobPersonId ? true : undefined}
            className={withFieldError(
              LEAVE_FORM_INPUT_CLASS,
              fieldErrors,
              "jobPersonId",
            )}
          >
            <option value="">— ไม่มอบงาน —</option>
            {jobPersonOptions.map((opt) => (
              <option key={opt.personId} value={opt.personId}>
                {opt.displayName}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.jobPersonId} />
        </div>
      </details>

      <details className="rounded-lg border">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
          <FileText className="size-4 text-muted-foreground" aria-hidden />
          ดูตัวอย่างหนังสือราชการ
        </summary>
        <div className="border-t p-4">
          <LeaveRequestLetterPreview
            officeName={officeName}
            requester={requester}
            leaveType={leaveType}
            writeAt={writeAt}
            because={because}
            leaveStart={leaveStart}
            leaveFinish={leaveFinish}
            leaveTotal={leaveTotal}
            halfDayPeriod={halfDayPeriod}
            contact={contact}
            contactTel={contactTel}
            lastLeave={lastLeave}
          />
        </div>
      </details>
    </div>
  );
}
