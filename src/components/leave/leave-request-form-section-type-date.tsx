"use client";

import type { RefObject } from "react";
import { FieldError } from "@/components/shared/field-error";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import {
  formatLeaveDays,
  withFieldError,
  LEAVE_FORM_INPUT_CLASS,
} from "@/components/leave/leave-request-form-shared";
import { LeaveTypePicker } from "@/components/leave/leave-type-picker";
import { HALF_DAY_OPTIONS, leaveTypeAllowsBackdate } from "@/lib/leave/constants";
import type { QuotaSummary } from "@/lib/leave/quota";
import type { PersonSex } from "@/lib/person/constants";

type LeaveTypeOption = { value: number; label: string };

type LeaveRequestFormSectionTypeDateProps = {
  sectionRef?: RefObject<HTMLElement | null>;
  leaveTypeOptions: LeaveTypeOption[];
  leaveType: string;
  onLeaveTypeChange: (value: string) => void;
  halfDay: boolean;
  onHalfDayToggle: (checked: boolean) => void;
  halfDayPeriod: string;
  onHalfDayPeriodChange: (value: string) => void;
  leaveStart: string;
  leaveFinish: string;
  onLeaveStartChange: (iso: string) => void;
  onLeaveFinishChange: (iso: string) => void;
  leaveTotal: number;
  minIso: string | undefined;
  leaveTypeNum: number;
  quotaHints: QuotaSummary[];
  personSex: PersonSex | null | undefined;
  fieldErrors: Record<string, string>;
  sectionError: string | null;
};

export function LeaveRequestFormSectionTypeDate({
  sectionRef,
  leaveTypeOptions,
  leaveType,
  onLeaveTypeChange,
  halfDay,
  onHalfDayToggle,
  halfDayPeriod,
  onHalfDayPeriodChange,
  leaveStart,
  leaveFinish,
  onLeaveStartChange,
  onLeaveFinishChange,
  leaveTotal,
  minIso,
  leaveTypeNum,
  quotaHints,
  personSex,
  fieldErrors,
  sectionError,
}: LeaveRequestFormSectionTypeDateProps) {
  const allowsBackdate =
    leaveTypeNum > 0 && leaveTypeAllowsBackdate(leaveTypeNum);

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">ประเภทการลา</legend>
        <LeaveTypePicker
          options={leaveTypeOptions}
          value={leaveType}
          onChange={onLeaveTypeChange}
          quotaHints={quotaHints}
          personSex={personSex}
          fieldError={fieldErrors.leaveType}
        />
      </fieldset>

      <fieldset
        ref={sectionRef as RefObject<HTMLFieldSetElement>}
        id="leave-date-section"
        className="space-y-4 border-t pt-6"
      >
        <legend className="text-sm font-medium">ช่วงวันลา</legend>

        {!leaveType ? (
          <p className="text-sm text-muted-foreground">
            เลือกประเภทการลาก่อนระบุวัน
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
              <div className="space-y-1">
                <span className="text-sm font-medium">ขอลาตั้งแต่วันที่</span>
                <div className="w-full sm:w-44">
                  <ThaiDatePicker
                    key={halfDay ? "leaveStart-half" : "leaveStart-full"}
                    id="leaveStart"
                    name="leaveStart"
                    defaultValue={leaveStart || undefined}
                    minIso={minIso}
                    error={fieldErrors.leaveStart}
                    onChange={onLeaveStartChange}
                  />
                </div>
                <FieldError message={fieldErrors.leaveStart} />
              </div>

              {!halfDay ? (
                <div className="space-y-1">
                  <span className="text-sm font-medium">ถึงวันที่</span>
                  <div className="w-full sm:w-44">
                    <ThaiDatePicker
                      key={`leaveFinish-${leaveFinish}`}
                      id="leaveFinish"
                      name="leaveFinish"
                      defaultValue={leaveFinish || undefined}
                      minIso={minIso}
                      error={fieldErrors.leaveFinish}
                      onChange={onLeaveFinishChange}
                    />
                  </div>
                  <FieldError message={fieldErrors.leaveFinish} />
                </div>
              ) : (
                <input
                  type="hidden"
                  name="leaveFinish"
                  value={leaveStart}
                  readOnly
                />
              )}

              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">มีกำหนด</span>
                <span className="inline-flex h-9 min-w-[3rem] items-center justify-center rounded-lg border bg-muted/40 px-2 text-base font-semibold tabular-nums">
                  {leaveTotal > 0 ? formatLeaveDays(leaveTotal) : "—"}
                </span>
                <span>วัน</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={halfDay}
                  onChange={(e) => onHalfDayToggle(e.target.checked)}
                />
                ลาครึ่งวัน (0.5 วัน)
              </label>
              {halfDay ? (
                <select
                  id="halfDayPeriod"
                  name="halfDayPeriod"
                  value={halfDayPeriod}
                  onChange={(e) => onHalfDayPeriodChange(e.target.value)}
                  aria-invalid={fieldErrors.halfDayPeriod ? true : undefined}
                  className={withFieldError(
                    LEAVE_FORM_INPUT_CLASS,
                    fieldErrors,
                    "halfDayPeriod",
                  )}
                >
                  <option value="">— เลือกช่วง —</option>
                  {HALF_DAY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="hidden"
                  name="halfDayPeriod"
                  value=""
                  readOnly
                />
              )}
              <FieldError message={fieldErrors.halfDayPeriod} />
            </div>

            {!halfDay && minIso ? (
              <p className="text-xs text-muted-foreground">
                ลาประเภทนี้เลือกได้ตั้งแต่วันนี้เป็นต้นไป
              </p>
            ) : null}
            {allowsBackdate ? (
              <p className="text-xs text-muted-foreground">
                ลาประเภทนี้สามารถลาย้อนหลังได้ตามระเบียบ 2555
              </p>
            ) : null}
          </>
        )}

        {sectionError ? (
          <p className="text-sm text-destructive" role="alert">
            {sectionError}
          </p>
        ) : null}
      </fieldset>
    </div>
  );
}
