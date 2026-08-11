"use client";

import Link from "next/link";
import { LeaveStatisticsTable } from "@/components/leave/leave-statistics-table";
import { formatThaiDate } from "@/lib/format/thai-date";
import type {
  LastLeaveInfo,
  LeaveStatRow,
} from "@/lib/leave/form-context-shared";
import {
  leaveTypesRequiringSex,
  LEAVE_TYPES,
} from "@/lib/leave/constants";
import type { LeaveTypeId } from "@/lib/leave/regulation/types";
import type { QuotaSummary } from "@/lib/leave/quota";
import type { PersonSex } from "@/lib/person/constants";
import { formatLeaveDays } from "@/components/leave/leave-request-form-shared";
import { cn } from "@/lib/utils";

type LeaveRequestQuotaPanelProps = {
  leaveTypeNum: number;
  quotaForType: QuotaSummary | null;
  vacationQuota: QuotaSummary | null;
  lastLeave: LastLeaveInfo | null;
  statistics: {
    rows: LeaveStatRow[];
    relaxCollect: number | null;
    relaxThisYear: number | null;
  } | null;
  personSex: PersonSex | null | undefined;
  personId?: string;
  variant?: "inline" | "aside";
  className?: string;
};

export function LeaveRequestQuotaPanel({
  leaveTypeNum,
  quotaForType,
  vacationQuota,
  lastLeave,
  statistics,
  personSex,
  personId,
  variant = "inline",
  className,
}: LeaveRequestQuotaPanelProps) {
  const personStaffHref = personId
    ? `/modules/person/staff?q=${encodeURIComponent(personId)}`
    : "/modules/person/staff";
  const isAside = variant === "aside";
  const headingId = isAside
    ? "leave-quota-heading-aside"
    : "leave-quota-heading-inline";

  return (
    <section
      className={cn(
        "space-y-4",
        !isAside && "border-t border-border pt-6",
        className,
      )}
      aria-labelledby={headingId}
    >
      <h3 id={headingId} className="text-sm font-medium">
        สิทธิและสถิติ
      </h3>

      {!leaveTypeNum ? (
        <p className="text-sm text-muted-foreground">
          เลือกประเภทการลาเพื่อดูสิทธิและสถิติ
        </p>
      ) : (
        <div className="space-y-4">
          {!personSex ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              ยังไม่เลือกคำนำหน้า — ประเภท{" "}
              {leaveTypesRequiringSex()
                .map((id) => LEAVE_TYPES[id].label)
                .join(", ")}{" "}
              ยื่นไม่ได้จนกว่าจะตั้งใน{" "}
              <Link
                href={personStaffHref}
                className="font-medium underline underline-offset-2"
              >
                ข้อมูลบุคลากร
              </Link>
            </div>
          ) : null}

          {quotaForType?.missingServiceStart ? (
            <p className="text-sm text-destructive">
              กรุณาระบุวันเริ่มราชการก่อนยื่นลาพักผ่อน —{" "}
              <Link
                href={personStaffHref}
                className="font-medium underline underline-offset-2"
              >
                ข้อมูลบุคลากร
              </Link>
            </p>
          ) : null}

          {quotaForType &&
          !quotaForType.unlimited &&
          !quotaForType.missingServiceStart &&
          (leaveTypeNum === 4 || leaveTypeNum === 5) ? (
            <div className="space-y-1 text-sm">
              <p className="font-medium">สิทธิ{quotaForType.label}</p>
              <p className="text-muted-foreground">
                ใช้ไป {quotaForType.used} วัน
                {quotaForType.entitled !== null
                  ? ` · สิทธิ ${quotaForType.entitled} วัน`
                  : ""}
                {quotaForType.carried > 0
                  ? ` · สะสม ${quotaForType.carried} วัน`
                  : ""}
                {quotaForType.remaining !== null
                  ? ` · คงเหลือ ${quotaForType.remaining} วัน`
                  : ""}
              </p>
            </div>
          ) : null}

          <div className="space-y-1 text-sm">
            <p className="font-medium">ลาครั้งสุดท้าย</p>
            {lastLeave ? (
              <p className="text-muted-foreground">
                {formatThaiDate(lastLeave.leaveStart)} –{" "}
                {formatThaiDate(lastLeave.leaveFinish)} (
                {formatLeaveDays(lastLeave.leaveTotal)} วัน)
              </p>
            ) : (
              <p className="text-muted-foreground">
                ไม่มีประวัติลาประเภทนี้ที่อนุมัติแล้ว
              </p>
            )}
          </div>

          {statistics ? (
            <LeaveStatisticsTable
              rows={statistics.rows}
              selectedLeaveType={leaveTypeNum as LeaveTypeId}
              relaxCollect={statistics.relaxCollect}
              relaxThisYear={statistics.relaxThisYear}
              missingVacationServiceStart={
                vacationQuota?.missingServiceStart ?? false
              }
              density={isAside ? "compact" : "default"}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}
