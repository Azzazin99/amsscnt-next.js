"use client";

import { formatThaiDate } from "@/lib/format/thai-date";
import type { LastLeaveInfo, LeaveRequesterProfile } from "@/lib/leave/form-context-shared";
import { leaveTypeLabelForValue } from "@/components/leave/leave-type-picker";
import { formatLeaveDays } from "@/components/leave/leave-request-form-shared";
import type { HalfDayPeriod } from "@/lib/leave/regulation/types";

type LeaveRequestLetterPreviewProps = {
  officeName: string;
  requester: LeaveRequesterProfile;
  leaveType: string;
  writeAt: string;
  because: string;
  leaveStart: string;
  leaveFinish: string;
  leaveTotal: number;
  halfDayPeriod: HalfDayPeriod | null;
  contact: string;
  contactTel: string;
  lastLeave: LastLeaveInfo | null;
};

export function LeaveRequestLetterPreview({
  officeName,
  requester,
  leaveType,
  writeAt,
  because,
  leaveStart,
  leaveFinish,
  leaveTotal,
  halfDayPeriod,
  contact,
  contactTel,
  lastLeave,
}: LeaveRequestLetterPreviewProps) {
  const typeLabel = leaveType ? leaveTypeLabelForValue(leaveType) : "—";
  const addressee = `ผู้อำนวยการ${officeName}`;

  const dateRange =
    leaveStart && leaveFinish
      ? halfDayPeriod
        ? `${formatThaiDate(leaveStart)} (${halfDayPeriod === "morning" ? "ครึ่งวันเช้า" : "ครึ่งวันบ่าย"})`
        : `${formatThaiDate(leaveStart)} ถึงวันที่ ${formatThaiDate(leaveFinish)}`
      : "—";

  const totalLabel =
    leaveTotal > 0 ? `${formatLeaveDays(leaveTotal)} วัน` : "—";

  return (
    <div
      className="rounded-xl bg-muted/30 p-4 text-sm leading-relaxed sm:p-5"
      aria-live="polite"
    >
      <div className="mx-auto max-w-prose space-y-3 text-pretty">
        <p>
          <span className="font-medium">เขียนที่</span>{" "}
          {writeAt.trim() || "—"}
        </p>
        <p>
          <span className="font-medium">เรื่อง</span> {typeLabel}
        </p>
        <p>
          <span className="font-medium">เรียน</span> {addressee}
        </p>
        <p>
          <span className="font-medium">ข้าพเจ้า</span> {requester.displayName}{" "}
          ตำแหน่ง{requester.positionLabel}
        </p>
        <p className="indent-8">
          ขออนุญาต{typeLabel} เนื่องจาก {because.trim() || "…"}
        </p>
        <p className="indent-8">
          ตั้งแต่วันที่ {dateRange} มีกำหนด {totalLabel}
        </p>
        <p className="indent-8 text-muted-foreground">
          ลาครั้งสุดท้าย{" "}
          {lastLeave ? (
            <>
              ตั้งแต่วันที่ {formatThaiDate(lastLeave.leaveStart)} ถึงวันที่{" "}
              {formatThaiDate(lastLeave.leaveFinish)} มีกำหนด{" "}
              {formatLeaveDays(lastLeave.leaveTotal)} วัน
            </>
          ) : (
            "— ไม่มีประวัติลาประเภทนี้ที่อนุมัติแล้ว"
          )}
        </p>
        <p className="indent-8">
          ระหว่างลาติดต่อได้ที่ {contact.trim() || "—"}
          {contactTel.trim() ? ` โทร ${contactTel.trim()}` : ""}
        </p>
      </div>
    </div>
  );
}
