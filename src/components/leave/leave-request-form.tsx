"use client";

import Link from "next/link";
import { Paperclip } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FieldError } from "@/components/shared/field-error";
import { LeaveStatisticsTable } from "@/components/leave/leave-statistics-table";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { Button } from "@/components/ui/button";
import { formatThaiDate } from "@/lib/format/thai-date";
import {
  computeLeaveTotal,
  HALF_DAY_OPTIONS,
  leaveAttachmentHint,
  leaveTypeAllowsBackdate,
  leaveTypeOptionsForSex,
  leaveTypesRequiringSex,
  requiresLeaveAttachment,
  showsLeaveAttachmentUI,
} from "@/lib/leave/constants";
import {
  buildLeaveStatisticsSnapshot,
  type LastLeaveInfo,
  type LeaveApproverOption,
  type LeaveRequesterProfile,
  type StatsLeaveTypeId,
} from "@/lib/leave/form-context-shared";
import { LEAVE_TYPES, type HalfDayPeriod, type LeaveTypeId } from "@/lib/leave/regulation/types";
import type { QuotaSummary } from "@/lib/leave/quota";
import { formDataToObject, zodFieldErrors } from "@/lib/form/zod-client";
import { PHONE_DIGITS_ONLY_MESSAGE } from "@/lib/form/validation-messages";
import { leaveRequestCreateSchema } from "@/lib/leave/schemas";
import type { PersonSex } from "@/lib/person/constants";
import { cn } from "@/lib/utils";

export type LeaveRequestFormInitialValues = {
  leaveType: number;
  writeAt: string | null;
  because: string;
  leaveStart: string;
  leaveFinish: string;
  halfDayPeriod: HalfDayPeriod | null;
  contact: string | null;
  contactTel: string | null;
  noComment: boolean;
  grantPersonSelected: string | null;
  jobPersonId: string | null;
  documentName: string | null;
};

type LeaveRequestFormProps = {
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string } | void>;
  cancelHref: string;
  todayIso: string;
  officeName: string;
  requester: LeaveRequesterProfile;
  approverOptions: LeaveApproverOption[];
  jobPersonOptions: LeaveApproverOption[];
  statsAgoByType: Record<StatsLeaveTypeId, number>;
  relaxCollect: number | null;
  relaxThisYear: number | null;
  lastLeaveByType: Partial<Record<LeaveTypeId, LastLeaveInfo>>;
  quotaHints?: QuotaSummary[];
  personSex?: PersonSex | null;
  initialValues?: LeaveRequestFormInitialValues;
  leaveTypeFilter?: LeaveTypeId[];
  defaultLeaveType?: LeaveTypeId;
  submitLabel?: string;
  formTitle?: string;
  existingAttachmentName?: string | null;
};

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const inlineInputClass =
  "h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const LEAVE_ATTACHMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.gif";

const LEAVE_ATTACHMENT_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
]);

function withFieldError(
  className: string,
  fieldErrors: Record<string, string>,
  name: string,
) {
  return cn(className, fieldErrors[name] && "border-destructive");
}

function isAllowedLeaveAttachmentName(fileName: string): boolean {
  const ext = fileName.includes(".")
    ? `.${fileName.split(".").pop()!.toLowerCase()}`
    : "";
  return LEAVE_ATTACHMENT_EXTENSIONS.has(ext);
}

function formatDays(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function LeaveRequestForm({
  action,
  cancelHref,
  todayIso,
  officeName,
  requester,
  approverOptions,
  jobPersonOptions,
  statsAgoByType,
  relaxCollect,
  relaxThisYear,
  lastLeaveByType,
  quotaHints = [],
  personSex = null,
  initialValues,
  leaveTypeFilter,
  defaultLeaveType,
  submitLabel = "บันทึกขออนุญาตลา",
  formTitle = "บันทึกขออนุญาตลา",
  existingAttachmentName = null,
}: LeaveRequestFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [leaveType, setLeaveType] = useState(() =>
    initialValues?.leaveType
      ? String(initialValues.leaveType)
      : defaultLeaveType
        ? String(defaultLeaveType)
        : "",
  );
  const [halfDay, setHalfDay] = useState(() =>
    Boolean(initialValues?.halfDayPeriod),
  );
  const [leaveStart, setLeaveStart] = useState(
    () => initialValues?.leaveStart ?? "",
  );
  const [leaveFinish, setLeaveFinish] = useState(
    () => initialValues?.leaveFinish ?? "",
  );
  const [halfDayPeriod, setHalfDayPeriod] = useState(
    () => initialValues?.halfDayPeriod ?? "",
  );
  const [contactTel, setContactTel] = useState(
    () => initialValues?.contactTel ?? "",
  );
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const leaveTypeOptions = useMemo(() => {
    const options = leaveTypeOptionsForSex(personSex);
    if (!leaveTypeFilter?.length) return options;
    const allowed = new Set(leaveTypeFilter);
    return options.filter((opt) => allowed.has(opt.value as LeaveTypeId));
  }, [personSex, leaveTypeFilter]);

  const leaveTypeNum = Number(leaveType);

  const minIso = useMemo(() => {
    if (!leaveTypeNum || leaveTypeAllowsBackdate(leaveTypeNum)) return undefined;
    return todayIso;
  }, [leaveTypeNum, todayIso]);

  const quotaForType = useMemo(() => {
    if (!leaveTypeNum) return null;
    return quotaHints.find((q) => q.leaveType === leaveTypeNum) ?? null;
  }, [leaveTypeNum, quotaHints]);

  const vacationQuota = useMemo(
    () => quotaHints.find((q) => q.leaveType === 4) ?? null,
    [quotaHints],
  );

  const leaveTotal = useMemo(() => {
    if (!leaveTypeNum || !leaveStart || !leaveFinish) return 0;
    const period: HalfDayPeriod | null =
      halfDay && (halfDayPeriod === "morning" || halfDayPeriod === "afternoon")
        ? halfDayPeriod
        : null;
    try {
      return computeLeaveTotal(leaveStart, leaveFinish, period);
    } catch {
      return 0;
    }
  }, [leaveTypeNum, leaveStart, leaveFinish, halfDay, halfDayPeriod]);

  const lastLeave = useMemo(() => {
    if (!leaveTypeNum) return null;
    return lastLeaveByType[leaveTypeNum as LeaveTypeId] ?? null;
  }, [leaveTypeNum, lastLeaveByType]);

  const statistics = useMemo(() => {
    if (!leaveTypeNum) return null;
    return buildLeaveStatisticsSnapshot(
      statsAgoByType,
      leaveTypeNum as LeaveTypeId,
      leaveTotal,
      relaxCollect,
      relaxThisYear,
    );
  }, [
    statsAgoByType,
    leaveTypeNum,
    leaveTotal,
    relaxCollect,
    relaxThisYear,
  ]);

  const missingServiceStart = Boolean(quotaForType?.missingServiceStart);

  const quotaExhausted =
    quotaForType &&
    !quotaForType.unlimited &&
    !quotaForType.missingServiceStart &&
    quotaForType.remaining !== null &&
    quotaForType.remaining <= 0;

  const showQuotaSummaryInline =
    (leaveTypeNum === 4 || leaveTypeNum === 5) &&
    quotaForType &&
    !quotaForType.unlimited &&
    !quotaForType.missingServiceStart;

  const attachmentVisible = useMemo(() => {
    if (!leaveTypeNum) return false;
    return showsLeaveAttachmentUI({ leaveType: leaveTypeNum });
  }, [leaveTypeNum]);

  const attachmentRequired = useMemo(() => {
    if (!leaveTypeNum) return false;
    return requiresLeaveAttachment({ leaveType: leaveTypeNum, leaveTotal });
  }, [leaveTypeNum, leaveTotal]);

  const attachmentHint = useMemo(() => {
    if (!leaveTypeNum) return null;
    return leaveAttachmentHint(leaveTypeNum, leaveTotal);
  }, [leaveTypeNum, leaveTotal]);

  useEffect(() => {
    if (!attachmentVisible) {
      setPendingFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [attachmentVisible]);

  useEffect(() => {
    if (halfDay && leaveStart && leaveFinish !== leaveStart) {
      setLeaveFinish(leaveStart);
    }
  }, [halfDay, leaveStart, leaveFinish]);

  function handleHalfDayToggle(checked: boolean) {
    setHalfDay(checked);
    if (!checked) {
      setHalfDayPeriod("");
      return;
    }
    if (leaveStart) setLeaveFinish(leaveStart);
  }

  function handleLeaveStartChange(iso: string) {
    setLeaveStart(iso);
    if (halfDay) setLeaveFinish(iso);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPendingFileName(null);
      return;
    }
    if (!isAllowedLeaveAttachmentName(file.name)) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPendingFileName(null);
      setFieldErrors({ attachment: "รองรับเฉพาะ PDF และรูปภาพ" });
      return;
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.attachment;
      return next;
    });
    setPendingFileName(file.name);
  }

  function clearFile() {
    setPendingFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function applyContactTelValue(raw: string) {
    const digitsOnly = raw.replace(/\D/g, "");
    setContactTel(digitsOnly);
    if (raw !== digitsOnly) {
      setFieldErrors((prev) => ({
        ...prev,
        contactTel: PHONE_DIGITS_ONLY_MESSAGE,
      }));
      return;
    }
    setFieldErrors((prev) => {
      if (!prev.contactTel) return prev;
      const next = { ...prev };
      delete next.contactTel;
      return next;
    });
  }

  function handleContactTelChange(e: React.ChangeEvent<HTMLInputElement>) {
    applyContactTelValue(e.target.value);
  }

  function handleContactTelPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text");
    if (!/\D/.test(pasted)) return;
    e.preventDefault();
    const input = e.currentTarget;
    const nextRaw = `${input.value.slice(0, input.selectionStart ?? 0)}${pasted}${input.value.slice(input.selectionEnd ?? 0)}`;
    applyContactTelValue(nextRaw);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    const formData = new FormData(e.currentTarget);

    const parsed = leaveRequestCreateSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      const nextFieldErrors = zodFieldErrors(parsed.error);
      setFieldErrors(nextFieldErrors);
      const firstKey = Object.keys(nextFieldErrors)[0];
      if (firstKey) {
        const el =
          e.currentTarget.querySelector<HTMLElement>(`#${CSS.escape(firstKey)}`) ??
          e.currentTarget.querySelector<HTMLElement>(`[name="${firstKey}"]`);
        el?.focus();
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (
      halfDay &&
      halfDayPeriod !== "morning" &&
      halfDayPeriod !== "afternoon"
    ) {
      setFieldErrors({ halfDayPeriod: "กรุณาเลือกช่วงลาครึ่งวัน" });
      return;
    }

    if (attachmentRequired) {
      const file = fileInputRef.current?.files?.[0];
      if ((!file || file.size === 0) && !existingAttachmentName) {
        setFieldErrors({ attachment: "กรุณาแนบไฟล์หลักฐาน" });
        return;
      }
    }

    setLoading(true);
    try {
      const result = await action(formData);
      if (result && "ok" in result && !result.ok) {
        setError(result.message ?? "บันทึกไม่สำเร็จ");
      }
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const addressee = `ผู้อำนวยการ${officeName}`;

  return (
    <form noValidate onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-5">
      <header className="space-y-1 text-center">
        <h2 className="text-lg font-semibold text-primary">{formTitle}</h2>
        <p className="text-xs text-muted-foreground">
          ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยการลาของข้าราชการ พ.ศ. 2555
        </p>
      </header>

      {!personSex ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <p>
            ยังไม่เลือกคำนำหน้าในระบบ — ประเภท{" "}
            {leaveTypesRequiringSex()
              .map((id) => LEAVE_TYPES[id].label)
              .join(", ")}{" "}
            จะยื่นไม่ได้จนกว่าจะเลือกคำนำหน้า (นาย/นาง/นางสาว) ใน{" "}
            <Link
              href="/modules/person/staff"
              className="font-medium underline underline-offset-2"
            >
              ข้อมูลบุคลากร
            </Link>
          </p>
        </div>
      ) : null}

      <div className="space-y-8 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium">เนื้อหาคำขอ</legend>

        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-1 text-sm">
          <span className="shrink-0 pt-2 font-medium">เขียนที่</span>
          <div className="min-w-0">
            <input
              id="writeAt"
              name="writeAt"
              maxLength={100}
              defaultValue={initialValues?.writeAt ?? ""}
              aria-invalid={fieldErrors.writeAt ? true : undefined}
              className={withFieldError(cn(inlineInputClass, "w-full"), fieldErrors, "writeAt")}
              placeholder="เช่น สำนักงานเขตพื้นที่การศึกษา..."
            />
            <FieldError message={fieldErrors.writeAt} />
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-x-2 gap-y-2 text-sm">
          <span className="shrink-0 font-medium">เรื่อง</span>
          <div className="min-w-[14rem] flex-1">
            <select
              id="leaveType"
              name="leaveType"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              aria-invalid={fieldErrors.leaveType ? true : undefined}
              className={withFieldError(inputClass, fieldErrors, "leaveType")}
            >
              <option value="">— เลือกประเภทการลา —</option>
              {leaveTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.leaveType} />
            {missingServiceStart ? (
              <p className="mt-1 text-sm text-destructive">
                กรุณาระบุวันเริ่มราชการในข้อมูลบุคลากรก่อนยื่นลาพักผ่อน —{" "}
                <Link
                  href="/modules/person/staff"
                  className="font-medium underline underline-offset-2"
                >
                  ข้อมูลบุคลากร
                </Link>
              </p>
            ) : null}
            {quotaExhausted ? (
              <p className="mt-1 text-sm text-destructive">
                สิทธิ{quotaForType!.label}ในปีงบปัจจุบันหมดแล้ว
              </p>
            ) : null}
          </div>
        </div>

        <p className="text-sm">
          <span className="font-medium">เรียน</span> {addressee}
        </p>

        <p className="text-sm leading-relaxed">
          <span className="font-medium">ข้าพเจ้า</span> {requester.displayName}{" "}
          ตำแหน่ง{requester.positionLabel}
        </p>

        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-1 text-sm">
          <span className="shrink-0 pt-2 font-medium">เนื่องจาก</span>
          <div className="min-w-0">
            <input
              id="because"
              name="because"
              maxLength={250}
              defaultValue={initialValues?.because ?? ""}
              aria-invalid={fieldErrors.because ? true : undefined}
              className={withFieldError(cn(inlineInputClass, "w-full"), fieldErrors, "because")}
            />
            <FieldError message={fieldErrors.because} />
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={halfDay}
                onChange={(e) => handleHalfDayToggle(e.target.checked)}
              />
              ลาครึ่งวัน (0.5 วัน)
            </label>
            {halfDay ? (
              <select
                name="halfDayPeriod"
                value={halfDayPeriod}
                onChange={(e) => setHalfDayPeriod(e.target.value)}
                aria-invalid={fieldErrors.halfDayPeriod ? true : undefined}
                className={withFieldError(inputClass, fieldErrors, "halfDayPeriod")}
              >
                <option value="">— เลือกช่วง —</option>
                {HALF_DAY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input type="hidden" name="halfDayPeriod" value="" />
            )}
            <FieldError message={fieldErrors.halfDayPeriod} />
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <span className="font-medium">ขอลาตั้งแต่วันที่</span>
            <div className="w-44">
              <ThaiDatePicker
                key={halfDay ? "leaveStart-half" : "leaveStart-full"}
                id="leaveStart"
                name="leaveStart"
                defaultValue={leaveStart || undefined}
                minIso={minIso}
                error={fieldErrors.leaveStart}
                onChange={handleLeaveStartChange}
              />
            </div>
            {halfDay ? (
              <input type="hidden" name="leaveFinish" value={leaveStart} />
            ) : (
              <>
                <span>ถึงวันที่</span>
                <div className="w-44">
                  <ThaiDatePicker
                    key={`leaveFinish-${leaveFinish}`}
                    id="leaveFinish"
                    name="leaveFinish"
                    defaultValue={leaveFinish || undefined}
                    minIso={minIso}
                    error={fieldErrors.leaveFinish}
                    onChange={setLeaveFinish}
                  />
                </div>
              </>
            )}
            <span>มีกำหนด</span>
            <span className="inline-flex h-9 min-w-[3rem] items-center justify-center rounded-lg border bg-muted/40 px-2 tabular-nums">
              {leaveTotal > 0 ? formatDays(leaveTotal) : "—"}
            </span>
            <span>วัน</span>
          </div>

          {!halfDay && minIso ? (
            <p className="text-xs text-muted-foreground">
              ลาประเภทนี้เลือกได้ตั้งแต่วันนี้เป็นต้นไป
            </p>
          ) : null}
        </div>

        {leaveTypeNum ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">ลาครั้งสุดท้าย</span>
            {lastLeave ? (
              <>
                <span>ตั้งแต่วันที่ {formatThaiDate(lastLeave.leaveStart)}</span>
                <span>ถึงวันที่ {formatThaiDate(lastLeave.leaveFinish)}</span>
                <span>มีกำหนด {formatDays(lastLeave.leaveTotal)} วัน</span>
              </>
            ) : (
              <span>— ไม่มีประวัติลาประเภทนี้ที่อนุมัติแล้ว</span>
            )}
          </div>
        ) : null}
        </fieldset>

        <fieldset className="space-y-4 border-t pt-6">
          <legend className="text-sm font-medium">การติดต่อและเอกสาร</legend>

        <div className="flex flex-wrap items-start gap-2 text-sm">
          <span className="shrink-0 font-medium">ระหว่างลาติดต่อได้ที่</span>
          <input
            id="contact"
            name="contact"
            maxLength={150}
            defaultValue={initialValues?.contact ?? ""}
            aria-invalid={fieldErrors.contact ? true : undefined}
            className={cn(withFieldError(inlineInputClass, fieldErrors, "contact"), "min-w-[10rem] flex-[2]")}
          />
          <span className="shrink-0">เบอร์โทรศัพท์</span>
          <input
            id="contactTel"
            name="contactTel"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={20}
            value={contactTel}
            aria-invalid={fieldErrors.contactTel ? true : undefined}
            aria-describedby={fieldErrors.contactTel ? "contactTel-error" : undefined}
            className={cn(withFieldError(inlineInputClass, fieldErrors, "contactTel"), "w-36 shrink-0")}
            onChange={handleContactTelChange}
            onPaste={handleContactTelPaste}
          />
        </div>
        <FieldError message={fieldErrors.contact} />
        <FieldError id="contactTel-error" message={fieldErrors.contactTel} />

        {attachmentVisible ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              เอกสาร (ถ้ามี) {attachmentRequired ? "(บังคับ)" : ""}
            </p>
            {attachmentHint ? (
              <p className="text-sm text-muted-foreground">{attachmentHint}</p>
            ) : null}
            <div
              className={cn(
                "space-y-3 rounded-xl border bg-muted/30 p-4",
                fieldErrors.attachment && "border-destructive",
              )}
            >
              <input
                ref={fileInputRef}
                id="attachment"
                name="attachment"
                type="file"
                accept={LEAVE_ATTACHMENT_ACCEPT}
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={handleFileChange}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-10"
                  onClick={openFilePicker}
                >
                  <Paperclip data-icon="inline-start" />
                  {pendingFileName ? "เปลี่ยนไฟล์แนบ" : "เลือกไฟล์แนบ"}
                </Button>
                {pendingFileName ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-10"
                    onClick={clearFile}
                  >
                    ล้างไฟล์
                  </Button>
                ) : null}
              </div>
              {pendingFileName ? (
                <p className="text-sm text-foreground">
                  เลือกแล้ว:{" "}
                  <span className="font-medium">{pendingFileName}</span>
                </p>
              ) : existingAttachmentName ? (
                <p className="text-sm text-foreground">
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
          </div>
        ) : null}
        </fieldset>

        <fieldset className="space-y-4 border-t pt-6">
          <legend className="text-sm font-medium">สถิติและมอบงาน</legend>

          {statistics ? (
            <LeaveStatisticsTable
              rows={statistics.rows}
              selectedLeaveType={leaveTypeNum}
              relaxCollect={statistics.relaxCollect}
              relaxThisYear={statistics.relaxThisYear}
              missingVacationServiceStart={vacationQuota?.missingServiceStart ?? false}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              เลือกประเภทการลาเพื่อดูสถิติการลา
            </p>
          )}

          {showQuotaSummaryInline ? (
            <p className="text-sm text-muted-foreground">
              สิทธิ{quotaForType!.label} (ปีงบปัจจุบัน): ใช้ไป {quotaForType!.used} วัน
              {quotaForType!.entitled !== null
                ? ` · สิทธิ ${quotaForType!.entitled} วัน`
                : ""}
              {quotaForType!.carried > 0 ? ` · สะสม ${quotaForType!.carried} วัน` : ""}
              {quotaForType!.remaining !== null
                ? ` · คงเหลือ ${quotaForType!.remaining} วัน`
                : ""}
            </p>
          ) : null}

          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <label htmlFor="jobPersonId" className="text-sm font-medium">
                ผู้รับมอบงาน (ไม่บังคับ)
              </label>
              <p className="text-xs text-muted-foreground">
                ระบุผู้ที่รับงานแทนระหว่างลา — ผู้รับจะเห็นในเมนู รับมอบงาน
              </p>
              <select
                id="jobPersonId"
                name="jobPersonId"
                defaultValue={initialValues?.jobPersonId ?? ""}
                aria-invalid={fieldErrors.jobPersonId ? true : undefined}
                className={withFieldError(inputClass, fieldErrors, "jobPersonId")}
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
          </div>
        </fieldset>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={loading} className="min-h-11">
          {loading ? "กำลังบันทึก…" : submitLabel}
        </Button>
        <Link
          href={cancelHref}
          className={cn(
            "inline-flex min-h-11 items-center rounded-lg border px-4 text-sm hover:bg-muted",
          )}
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
