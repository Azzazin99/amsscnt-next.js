"use client";

import { FieldError } from "@/components/shared/field-error";
import {
  LEAVE_FORM_INPUT_CLASS,
  withFieldError,
} from "@/components/leave/leave-request-form-shared";
import {
  LEAVE_TYPES,
  type LeaveTypeId,
} from "@/lib/leave/regulation/types";
import { isLeaveTypeEligibleForSex } from "@/lib/leave/regulation/eligibility";
import type { QuotaSummary } from "@/lib/leave/quota";

const SICK_TYPE_IDS: LeaveTypeId[] = [1, 2, 3];
const VACATION_TYPE_ID: LeaveTypeId = 4;
const OTHER_TYPE_IDS: LeaveTypeId[] = [5, 6, 7, 8, 9, 10];

type LeaveTypeOption = { value: number; label: string };

type LeaveTypePickerProps = {
  options: LeaveTypeOption[];
  value: string;
  onChange: (value: string) => void;
  quotaHints: QuotaSummary[];
  personSex: string | null | undefined;
  fieldError?: string;
};

function quotaForType(
  quotaHints: QuotaSummary[],
  leaveType: number,
): QuotaSummary | null {
  return quotaHints.find((q) => q.leaveType === leaveType) ?? null;
}

function filterGroup(
  options: LeaveTypeOption[],
  ids: LeaveTypeId[],
): LeaveTypeOption[] {
  const allowed = new Set(ids);
  return options.filter((o) => allowed.has(o.value as LeaveTypeId));
}

function rowMeta(
  leaveType: number,
  quotaHints: QuotaSummary[],
  personSex: string | null | undefined,
) {
  const eligible = isLeaveTypeEligibleForSex(leaveType, personSex);
  const quota = quotaForType(quotaHints, leaveType);

  let warning: string | null = null;
  if (!eligible) {
    warning = "ไม่ตรงกับเพศในระบบ";
  } else if (quota?.missingServiceStart) {
    warning = "ระบุวันเริ่มราชการก่อน";
  } else if (
    quota &&
    !quota.unlimited &&
    quota.remaining !== null &&
    quota.remaining <= 0
  ) {
    warning = "สิทธิหมดแล้ว";
  }

  let quotaBadge: string | null = null;
  if (
    quota &&
    !quota.unlimited &&
    !quota.missingServiceStart &&
    quota.remaining !== null
  ) {
    quotaBadge = `คงเหลือ ${quota.remaining} วัน`;
  }

  const disabled = Boolean(warning);

  return { warning, quotaBadge, disabled };
}

function buildOptionLabel(
  baseLabel: string,
  meta: ReturnType<typeof rowMeta>,
): string {
  if (meta.warning === "ระบุวันเริ่มราชการก่อน") {
    return `${baseLabel} — ระบุวันเริ่มราชการก่อน`;
  }
  if (meta.warning === "สิทธิหมดแล้ว") {
    return `${baseLabel} — สิทธิหมดแล้ว`;
  }
  if (meta.quotaBadge) {
    return `${baseLabel} — ${meta.quotaBadge}`;
  }
  return baseLabel;
}

function renderOptions(
  groupOptions: LeaveTypeOption[],
  quotaHints: QuotaSummary[],
  personSex: string | null | undefined,
) {
  return groupOptions.map((opt) => {
    const meta = rowMeta(opt.value, quotaHints, personSex);
    return (
      <option
        key={opt.value}
        value={opt.value}
        disabled={meta.disabled}
      >
        {buildOptionLabel(opt.label, meta)}
      </option>
    );
  });
}

export function LeaveTypePicker({
  options,
  value,
  onChange,
  quotaHints,
  personSex,
  fieldError,
}: LeaveTypePickerProps) {
  const sickOptions = filterGroup(options, SICK_TYPE_IDS);
  const vacationOptions = filterGroup(options, [VACATION_TYPE_ID]);
  const otherOptions = filterGroup(options, OTHER_TYPE_IDS);

  const hasSick = sickOptions.length > 0;
  const hasVacation = vacationOptions.length > 0;
  const hasOther = otherOptions.length > 0;
  const hasOptions = options.length > 0;

  const fieldErrors: Record<string, string> = fieldError
    ? { leaveType: fieldError }
    : {};

  return (
    <div className="space-y-2">
      <select
        id="leaveType"
        name="leaveType"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!hasOptions}
        aria-invalid={fieldError ? true : undefined}
        aria-describedby={fieldError ? "leaveType-error" : undefined}
        className={withFieldError(
          LEAVE_FORM_INPUT_CLASS,
          fieldErrors,
          "leaveType",
        )}
      >
        <option value="">— เลือกประเภทการลา —</option>
        {hasSick ? (
          <optgroup label="ลาป่วย / กิจ / คลอด">
            {renderOptions(sickOptions, quotaHints, personSex)}
          </optgroup>
        ) : null}
        {hasVacation ? (
          <optgroup label="ลาพักผ่อน">
            {renderOptions(vacationOptions, quotaHints, personSex)}
          </optgroup>
        ) : null}
        {hasOther ? (
          <optgroup label="อื่นตามระเบียบ 2555">
            {renderOptions(otherOptions, quotaHints, personSex)}
          </optgroup>
        ) : null}
      </select>
      <FieldError id="leaveType-error" message={fieldError} />
    </div>
  );
}

export function leaveTypeLabelForValue(value: string): string {
  const num = Number(value);
  if (num in LEAVE_TYPES) return LEAVE_TYPES[num as LeaveTypeId].label;
  return "—";
}
