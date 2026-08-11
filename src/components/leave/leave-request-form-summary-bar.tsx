"use client";

import Link from "next/link";
import { leaveTypeLabelForValue } from "@/components/leave/leave-type-picker";
import { formatLeaveDays } from "@/components/leave/leave-request-form-shared";
import { formatThaiDate, formatThaiDateCompact } from "@/lib/format/thai-date";
import { HALF_DAY_OPTIONS } from "@/lib/leave/constants";
import type { QuotaSummary } from "@/lib/leave/quota";
import { cn } from "@/lib/utils";

type LeaveRequestFormSummaryBarProps = {
  leaveType: string;
  leaveStart: string;
  leaveFinish: string;
  halfDay: boolean;
  halfDayPeriod: string;
  leaveTotal: number;
  quotaForType: QuotaSummary | null;
  submitLabel: string;
  loading: boolean;
  cancelHref: string;
  canSubmit: boolean;
  variant: "mobile-sticky" | "desktop-aside";
};

function formatDateRangeLabel(
  leaveStart: string,
  leaveFinish: string,
  halfDay: boolean,
  compact: boolean,
): string | null {
  if (!leaveStart) return null;

  const format = compact ? formatThaiDateCompact : formatThaiDate;
  const finish = leaveFinish || leaveStart;

  if (halfDay || leaveStart === finish) {
    return format(leaveStart);
  }

  return `${format(leaveStart)} – ${format(finish)}`;
}

function halfDayPeriodLabel(halfDay: boolean, halfDayPeriod: string): string | null {
  if (!halfDay) return null;
  return (
    HALF_DAY_OPTIONS.find((option) => option.value === halfDayPeriod)?.label ??
    null
  );
}

function quotaRemainingLabel(quotaForType: QuotaSummary | null): string | null {
  if (
    !quotaForType ||
    quotaForType.unlimited ||
    quotaForType.missingServiceStart ||
    quotaForType.remaining === null
  ) {
    return null;
  }

  return `${quotaForType.remaining} วัน`;
}

function quotaExceedsWarning(
  quotaForType: QuotaSummary | null,
  leaveTotal: number,
): string | null {
  if (
    !quotaForType ||
    quotaForType.unlimited ||
    quotaForType.missingServiceStart ||
    quotaForType.remaining === null ||
    leaveTotal <= 0 ||
    leaveTotal <= quotaForType.remaining
  ) {
    return null;
  }

  return "จำนวนวันลาครั้งนี้เกินสิทธิคงเหลือ";
}

function useSummaryContent({
  leaveType,
  leaveStart,
  leaveFinish,
  halfDay,
  halfDayPeriod,
  leaveTotal,
  quotaForType,
  compactDates,
}: {
  leaveType: string;
  leaveStart: string;
  leaveFinish: string;
  halfDay: boolean;
  halfDayPeriod: string;
  leaveTotal: number;
  quotaForType: QuotaSummary | null;
  compactDates: boolean;
}) {
  const hasType = Boolean(leaveType);
  const typeLabel = hasType
    ? leaveTypeLabelForValue(leaveType)
    : "เลือกประเภทและวันลาเพื่อดูสรุป";
  const daysLabel =
    leaveTotal > 0 ? `${formatLeaveDays(leaveTotal)} วัน` : "—";
  const dateRangeLabel = formatDateRangeLabel(
    leaveStart,
    leaveFinish,
    halfDay,
    compactDates,
  );
  const halfDayLabel = halfDayPeriodLabel(halfDay, halfDayPeriod);
  const remainingLabel = quotaRemainingLabel(quotaForType);
  const quotaWarning = quotaExceedsWarning(quotaForType, leaveTotal);
  const missingServiceStart = quotaForType?.missingServiceStart ?? false;

  return {
    hasType,
    typeLabel,
    daysLabel,
    dateRangeLabel,
    halfDayLabel,
    remainingLabel,
    quotaWarning,
    missingServiceStart,
  };
}

export function LeaveRequestFormSummaryBar({
  leaveType,
  leaveStart,
  leaveFinish,
  halfDay,
  halfDayPeriod,
  leaveTotal,
  quotaForType,
  submitLabel,
  loading,
  cancelHref,
  canSubmit,
  variant,
}: LeaveRequestFormSummaryBarProps) {
  const summary = useSummaryContent({
    leaveType,
    leaveStart,
    leaveFinish,
    halfDay,
    halfDayPeriod,
    leaveTotal,
    quotaForType,
    compactDates: variant === "mobile-sticky",
  });

  if (variant === "mobile-sticky") {
    const mobileDetail = [
      summary.dateRangeLabel,
      summary.halfDayLabel,
      summary.daysLabel !== "—" ? summary.daysLabel : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-4xl space-y-2">
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">{summary.typeLabel}</p>
            {mobileDetail ? (
              <p className="truncate text-muted-foreground">{mobileDetail}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Link
              href={cancelHref}
              className={cn(
                "inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border px-3 text-sm hover:bg-muted",
              )}
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="inline-flex min-h-11 flex-[2] items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "กำลังบันทึก…" : submitLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <p className="text-sm font-medium">สรุปคำขอ</p>

        {summary.hasType ? (
          <dl className="grid grid-cols-[minmax(4.5rem,auto)_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted-foreground">ประเภท</dt>
            <dd className="font-medium">{summary.typeLabel}</dd>

            {summary.dateRangeLabel ? (
              <>
                <dt className="text-muted-foreground">ช่วงวัน</dt>
                <dd className="text-pretty">{summary.dateRangeLabel}</dd>
              </>
            ) : null}

            {summary.halfDayLabel ? (
              <>
                <dt className="text-muted-foreground">ครึ่งวัน</dt>
                <dd>{summary.halfDayLabel}</dd>
              </>
            ) : null}

            <dt className="text-muted-foreground">จำนวน</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {summary.daysLabel}
            </dd>

            {summary.remainingLabel ? (
              <>
                <dt className="text-muted-foreground">คงเหลือ</dt>
                <dd className="tabular-nums">{summary.remainingLabel}</dd>
              </>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">{summary.typeLabel}</p>
        )}

        {summary.missingServiceStart ? (
          <p className="text-xs text-destructive">
            กรุณาระบุวันเริ่มราชการก่อนยื่นลาพักผ่อน
          </p>
        ) : null}

        {summary.quotaWarning ? (
          <p className="text-xs text-destructive" role="alert">
            {summary.quotaWarning}
          </p>
        ) : null}
      </div>
    </div>
  );
}
