"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LeaveRequestFormSectionDetails } from "@/components/leave/leave-request-form-section-details";
import { LeaveRequestFormSectionTypeDate } from "@/components/leave/leave-request-form-section-type-date";
import { LeaveRequestFormSummaryBar } from "@/components/leave/leave-request-form-summary-bar";
import {
  isAllowedLeaveAttachmentName,
  resolveHalfDayPeriod,
} from "@/components/leave/leave-request-form-shared";
import { STANDARD_ATTACHMENT_TYPES_LABEL } from "@/lib/form/attachment-allowed-types";
import { LeaveRequestQuotaPanel } from "@/components/leave/leave-request-quota-panel";
import {
  computeLeaveTotal,
  leaveAttachmentHint,
  leaveTypeAllowsBackdate,
  leaveTypeOptionsForSex,
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
import type { HalfDayPeriod, LeaveTypeId } from "@/lib/leave/regulation/types";
import { validateLeaveRequestInput } from "@/lib/leave/regulation/validation";
import type { QuotaSummary } from "@/lib/leave/quota";
import { formDataToObject, zodFieldErrors } from "@/lib/form/zod-client";
import { normalizeThaiMobilePhoneInput } from "@/lib/form/thai-mobile-phone";
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
  personId?: string;
  initialValues?: LeaveRequestFormInitialValues;
  submitLabel?: string;
  formTitle?: string;
  existingAttachmentName?: string | null;
};

const SECTION_FIELD_MAP: Record<string, string> = {
  leaveType: "leave-type-section",
  leaveStart: "leave-date-section",
  leaveFinish: "leave-date-section",
  halfDayPeriod: "leave-date-section",
  because: "leave-details-section",
  writeAt: "leave-details-section",
  contact: "leave-details-section",
  contactTel: "leave-details-section",
  attachment: "leave-details-section",
  jobPersonId: "leave-details-section",
};

export function LeaveRequestForm({
  action,
  cancelHref,
  todayIso,
  officeName,
  requester,
  approverOptions: _approverOptions,
  jobPersonOptions,
  statsAgoByType,
  relaxCollect,
  relaxThisYear,
  lastLeaveByType,
  quotaHints = [],
  personSex = null,
  personId,
  initialValues,
  submitLabel = "บันทึกขออนุญาตลา",
  formTitle = "บันทึกขออนุญาตลา",
  existingAttachmentName = null,
}: LeaveRequestFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [leaveType, setLeaveType] = useState(() =>
    initialValues?.leaveType ? String(initialValues.leaveType) : "",
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
  const [writeAt, setWriteAt] = useState(() => initialValues?.writeAt ?? "");
  const [because, setBecause] = useState(() => initialValues?.because ?? "");
  const [contact, setContact] = useState(() => initialValues?.contact ?? "");
  const [contactTel, setContactTel] = useState(
    () => initialValues?.contactTel ?? "",
  );
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateSectionRef = useRef<HTMLElement>(null);

  const leaveTypeOptions = useMemo(
    () => leaveTypeOptionsForSex(personSex),
    [personSex],
  );

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

  const resolvedHalfDay = resolveHalfDayPeriod(halfDay, halfDayPeriod);

  const leaveTotal = useMemo(() => {
    if (!leaveTypeNum || !leaveStart) return 0;
    const finish = halfDay ? leaveStart : leaveFinish;
    if (!finish) return 0;
    try {
      return computeLeaveTotal(leaveStart, finish, resolvedHalfDay);
    } catch {
      return 0;
    }
  }, [leaveTypeNum, leaveStart, leaveFinish, halfDay, resolvedHalfDay]);

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
  }, [statsAgoByType, leaveTypeNum, leaveTotal, relaxCollect, relaxThisYear]);

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

  const canSubmit = Boolean(
    leaveType &&
      leaveStart &&
      (halfDay || leaveFinish) &&
      (!halfDay ||
        halfDayPeriod === "morning" ||
        halfDayPeriod === "afternoon") &&
      because.trim(),
  );

  useEffect(() => {
    if (!attachmentVisible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear attachment UI when section hidden
      setPendingFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [attachmentVisible]);

  useEffect(() => {
    if (halfDay && leaveStart && leaveFinish !== leaveStart) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- half-day leave must be single-day
      setLeaveFinish(leaveStart);
    }
  }, [halfDay, leaveStart, leaveFinish]);

  const scrollToSection = useCallback((sectionId: string) => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const el = document.getElementById(sectionId);
    el?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  function handleLeaveTypeChange(value: string) {
    setLeaveType(value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.leaveType;
      return next;
    });
    requestAnimationFrame(() => {
      document.getElementById("leaveStart")?.focus();
    });
  }

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

  function validateTypeAndDate(): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!leaveType) {
      errors.leaveType = "กรุณาเลือกประเภทการลา";
    }
    if (!leaveStart) {
      errors.leaveStart = "กรุณาระบุวันเริ่มลา";
    }
    if (!halfDay && !leaveFinish) {
      errors.leaveFinish = "กรุณาระบุวันสิ้นสุดลา";
    }
    if (
      halfDay &&
      halfDayPeriod !== "morning" &&
      halfDayPeriod !== "afternoon"
    ) {
      errors.halfDayPeriod = "กรุณาเลือกช่วงลาครึ่งวัน";
    }

    return errors;
  }

  function scrollToFirstError(errors: Record<string, string>) {
    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return;
    const sectionId = SECTION_FIELD_MAP[firstKey] ?? firstKey;
    scrollToSection(sectionId);
    const el =
      document.getElementById(firstKey) ??
      document.querySelector<HTMLElement>(`[name="${firstKey}"]`);
    el?.focus();
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
      setFieldErrors({
        attachment: `รองรับเฉพาะ ${STANDARD_ATTACHMENT_TYPES_LABEL}`,
      });
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
    const result = normalizeThaiMobilePhoneInput(raw);
    setContactTel(result.normalized);

    setFieldErrors((prev) => {
      if (result.ok) {
        if (!prev.contactTel) return prev;
        const next = { ...prev };
        delete next.contactTel;
        return next;
      }
      return { ...prev, contactTel: result.message };
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
    setSectionError(null);
    setError(null);

    const typeDateErrors = validateTypeAndDate();
    if (Object.keys(typeDateErrors).length > 0) {
      setFieldErrors(typeDateErrors);
      scrollToFirstError(typeDateErrors);
      return;
    }

    const remainingQuota =
      quotaForType && !quotaForType.unlimited && !quotaForType.missingServiceStart
        ? quotaForType.remaining
        : null;

    const validationError = validateLeaveRequestInput({
      leaveType: leaveTypeNum,
      leaveStart,
      leaveFinish: halfDay ? leaveStart : leaveFinish,
      halfDayPeriod: resolvedHalfDay,
      remainingQuota,
      personSex,
    });

    if (validationError) {
      setSectionError(validationError);
      scrollToSection("leave-date-section");
      return;
    }

    const formData = new FormData(e.currentTarget);

    const parsed = leaveRequestCreateSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      const nextFieldErrors = zodFieldErrors(parsed.error);
      setFieldErrors(nextFieldErrors);
      scrollToFirstError(nextFieldErrors);
      return;
    }

    if (attachmentRequired) {
      const file = fileInputRef.current?.files?.[0];
      if ((!file || file.size === 0) && !existingAttachmentName) {
        setFieldErrors({ attachment: "กรุณาแนบไฟล์หลักฐาน" });
        scrollToSection("leave-details-section");
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

  const finishIso = halfDay ? leaveStart : leaveFinish;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="mx-auto max-w-4xl space-y-5 pb-32 lg:pb-5"
    >
      <header className="space-y-1 text-center">
        <h2 className="text-lg font-semibold text-primary text-balance">
          {formTitle}
        </h2>
        <p className="text-xs text-muted-foreground">
          ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยการลาของข้าราชการ พ.ศ. 2555
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,28rem)]">
        <div className="min-w-0 space-y-0 rounded-xl border bg-card p-4 sm:p-6">
          <div id="leave-type-section">
            <LeaveRequestFormSectionTypeDate
              sectionRef={dateSectionRef}
              leaveTypeOptions={leaveTypeOptions}
              leaveType={leaveType}
              onLeaveTypeChange={handleLeaveTypeChange}
              halfDay={halfDay}
              onHalfDayToggle={handleHalfDayToggle}
              halfDayPeriod={halfDayPeriod}
              onHalfDayPeriodChange={setHalfDayPeriod}
              leaveStart={leaveStart}
              leaveFinish={leaveFinish}
              onLeaveStartChange={handleLeaveStartChange}
              onLeaveFinishChange={setLeaveFinish}
              leaveTotal={leaveTotal}
              minIso={minIso}
              leaveTypeNum={leaveTypeNum}
              quotaHints={quotaHints}
              personSex={personSex}
              fieldErrors={fieldErrors}
              sectionError={sectionError}
            />
          </div>

          <LeaveRequestQuotaPanel
            className="lg:hidden"
            leaveTypeNum={leaveTypeNum}
            quotaForType={quotaForType}
            vacationQuota={vacationQuota}
            lastLeave={lastLeave}
            statistics={statistics}
            personSex={personSex}
            personId={personId}
            variant="inline"
          />

          <div id="leave-details-section">
            <LeaveRequestFormSectionDetails
              officeName={officeName}
              requester={requester}
              leaveType={leaveType}
              leaveStart={leaveStart}
              leaveFinish={finishIso}
              leaveTotal={leaveTotal}
              halfDayPeriod={resolvedHalfDay}
              lastLeave={lastLeave}
              writeAt={writeAt}
              onWriteAtChange={setWriteAt}
              because={because}
              onBecauseChange={setBecause}
              contact={contact}
              onContactChange={setContact}
              contactTel={contactTel}
              onContactTelChange={handleContactTelChange}
              onContactTelPaste={handleContactTelPaste}
              jobPersonOptions={jobPersonOptions}
              initialJobPersonId={initialValues?.jobPersonId ?? null}
              attachmentVisible={attachmentVisible}
              attachmentRequired={attachmentRequired}
              attachmentHint={attachmentHint}
              pendingFileName={pendingFileName}
              existingAttachmentName={existingAttachmentName}
              fileInputRef={fileInputRef}
              onOpenFilePicker={openFilePicker}
              onFileChange={handleFileChange}
              onClearFile={clearFile}
              fieldErrors={fieldErrors}
            />
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="space-y-4 rounded-xl border bg-card p-4 lg:sticky lg:top-4">
            <LeaveRequestQuotaPanel
              leaveTypeNum={leaveTypeNum}
              quotaForType={quotaForType}
              vacationQuota={vacationQuota}
              lastLeave={lastLeave}
              statistics={statistics}
              personSex={personSex}
              personId={personId}
              variant="aside"
            />
            <div className="border-t border-border pt-4">
              <LeaveRequestFormSummaryBar
              leaveType={leaveType}
              leaveStart={leaveStart}
              leaveFinish={finishIso}
              halfDay={halfDay}
              halfDayPeriod={halfDayPeriod}
              leaveTotal={leaveTotal}
              quotaForType={quotaForType}
              submitLabel={submitLabel}
              loading={loading}
              cancelHref={cancelHref}
              canSubmit={canSubmit}
              variant="desktop-aside"
            />
            </div>
          </div>
        </aside>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="hidden flex-wrap gap-3 lg:flex">
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "กำลังบันทึก…" : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className={cn(
            "inline-flex min-h-11 items-center rounded-lg border px-4 text-sm hover:bg-muted",
          )}
        >
          ยกเลิก
        </Link>
      </div>

      <LeaveRequestFormSummaryBar
        leaveType={leaveType}
        leaveStart={leaveStart}
        leaveFinish={finishIso}
        halfDay={halfDay}
        halfDayPeriod={halfDayPeriod}
        leaveTotal={leaveTotal}
        quotaForType={quotaForType}
        submitLabel={submitLabel}
        loading={loading}
        cancelHref={cancelHref}
        canSubmit={canSubmit}
        variant="mobile-sticky"
      />
    </form>
  );
}
