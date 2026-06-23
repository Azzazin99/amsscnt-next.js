import Link from "next/link";
import { notFound } from "next/navigation";
import { LeaveApproveForm } from "@/components/leave/leave-approve-form";
import { approveLeaveStep } from "@/lib/leave/actions";
import {
  currentWorkflowStatus,
  leaveTypeLabel,
  workflowStatusLabel,
} from "@/lib/leave/constants";
import { formatThaiDate } from "@/lib/format/thai-date";
import {
  canApproveLeaveStep,
  getLeavePermissions,
} from "@/lib/leave/permissions";
import {
  canViewLeaveRequest,
  getLeaveCancellationBySourceRequestId,
  getLeavePersonSettings,
  getLeaveRequest,
  listLeaveRequestFiles,
} from "@/lib/leave/queries";
import { LeaveStatisticsTable } from "@/components/leave/leave-statistics-table";
import { LEAVE_TYPES } from "@/lib/leave/regulation/types";
import { requireLeaveScope } from "@/lib/leave/scope";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDateTime(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

export default async function LeaveRequestDetailPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const { user, perms, scope } = await requireLeaveScope();
  const request = await getLeaveRequest(id);
  if (!request || !canViewLeaveRequest(request, scope, user.personId)) {
    notFound();
  }

  const files = await listLeaveRequestFiles(id);
  const cancellationLink = await getLeaveCancellationBySourceRequestId(id);
  const signers = await getLeavePersonSettings(request.personId);
  const workflow = currentWorkflowStatus({
    schoolId: request.schoolId,
    groupDate: request.groupDate,
    groupDate2: request.groupDate2,
    commanderGrant: request.commanderGrant,
  });
  const userPerms = await getLeavePermissions(Number(user.id));
  const approveOptions = {
    isSchoolPersonnelRequest: request.schoolId != null,
  };

  const canApprove =
    (workflow === "group" ||
      workflow === "group2" ||
      workflow === "commander") &&
    canApproveLeaveStep(user, userPerms, workflow, signers, approveOptions);

  const statsRows =
    request.sickAgo !== null
      ? [
          {
            leaveType: 1 as const,
            label: LEAVE_TYPES[1].label,
            ago: request.sickAgo ?? 0,
            thisTime: request.sickThis ?? 0,
            total: request.sickTotal ?? 0,
          },
          {
            leaveType: 2 as const,
            label: LEAVE_TYPES[2].label,
            ago: request.privacyAgo ?? 0,
            thisTime: request.privacyThis ?? 0,
            total: request.privacyTotal ?? 0,
          },
          {
            leaveType: 3 as const,
            label: LEAVE_TYPES[3].label,
            ago: request.birthAgo ?? 0,
            thisTime: request.birthThis ?? 0,
            total: request.birthTotal ?? 0,
          },
          {
            leaveType: 4 as const,
            label: LEAVE_TYPES[4].label,
            ago: request.relaxAgo ?? 0,
            thisTime: request.relaxThis ?? 0,
            total: request.relaxTotal ?? 0,
          },
        ]
      : null;

  const halfDayLabel =
    request.halfDayPeriod === "morning"
      ? " (ครึ่งวันเช้า)"
      : request.halfDayPeriod === "afternoon"
        ? " (ครึ่งวันบ่าย)"
        : "";

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">รายละเอียดคำขอลา</h2>
        <Link
          href="/modules/leave/requests"
          className="text-sm text-primary hover:underline"
        >
          ← กลับรายการ
        </Link>
      </div>

      <dl className="divide-y rounded-xl border bg-card shadow-sm">
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ผู้ลา</dt>
          <dd className="sm:col-span-2">{request.displayName}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">เลขบัตร</dt>
          <dd className="font-mono text-sm sm:col-span-2">{request.personId}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">หน่วยงาน</dt>
          <dd className="sm:col-span-2">{request.schoolName ?? "เขตพื้นที่"}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ประเภทการลา</dt>
          <dd className="sm:col-span-2">{leaveTypeLabel(request.leaveType)}</dd>
        </div>
        {request.writeAt ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">เขียนที่</dt>
            <dd className="sm:col-span-2">{request.writeAt}</dd>
          </div>
        ) : null}
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">เหตุผล</dt>
          <dd className="sm:col-span-2">{request.because ?? "—"}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ช่วงวันลา</dt>
          <dd className="sm:col-span-2">
            {formatThaiDate(request.leaveStart)} – {formatThaiDate(request.leaveFinish)}
            {halfDayLabel} ({request.leaveTotal} วัน)
          </dd>
        </div>
        {request.lastLeaveStart ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">ลาครั้งสุดท้าย (ก่อนยื่น)</dt>
            <dd className="sm:col-span-2">
              {formatThaiDate(request.lastLeaveStart)} –{" "}
              {formatThaiDate(request.lastLeaveFinish ?? request.lastLeaveStart)}
              {request.lastLeaveTotal !== null
                ? ` (${request.lastLeaveTotal} วัน)`
                : ""}
            </dd>
          </div>
        ) : null}
        {request.contact ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">ติดต่อ</dt>
            <dd className="sm:col-span-2">{request.contact}</dd>
          </div>
        ) : null}
        {request.contactTel ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">โทรศัพท์</dt>
            <dd className="sm:col-span-2">{request.contactTel}</dd>
          </div>
        ) : null}
        {request.documentName ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">เอกสารอ้างอิง</dt>
            <dd className="sm:col-span-2">{request.documentName}</dd>
          </div>
        ) : null}
        {files.length > 0 ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">ไฟล์แนบ</dt>
            <dd className="sm:col-span-2">
              <ul className="space-y-1">
                {files.map((f) => (
                  <li key={f.id}>
                    <a
                      href={`/api/leave/requests/${id}/files/${f.id}`}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {f.fileDes ?? f.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">สถานะ</dt>
          <dd className="sm:col-span-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                workflow === "approved"
                  ? "bg-green-100 text-green-800"
                  : workflow === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800",
              )}
            >
              {workflowStatusLabel(workflow)}
            </span>
            {workflow === "approved" && cancellationLink ? (
              <p className="mt-2 text-sm">
                <Link
                  href={`/modules/leave/cancellations/${cancellationLink.id}`}
                  className="text-primary hover:underline"
                >
                  ดูคำขอยกเลิกวันลา
                </Link>
                {cancellationLink.commanderGrant === 1
                  ? " (อนุมัติแล้ว)"
                  : cancellationLink.commanderGrant === 0
                    ? " (ไม่อนุมัติ)"
                    : " (รอพิจารณา)"}
              </p>
            ) : null}
          </dd>
        </div>
        {request.groupDate ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">ผอ.กลุ่ม</dt>
            <dd className="sm:col-span-2">
              {request.groupComment ?? "—"} · {formatDateTime(request.groupDate)}
            </dd>
          </div>
        ) : null}
        {request.groupDate2 ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">รอง ผอ.สพท.</dt>
            <dd className="sm:col-span-2">
              {request.groupComment2 ?? "—"} · {formatDateTime(request.groupDate2)}
            </dd>
          </div>
        ) : null}
        {request.commanderComment && request.schoolId != null ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">ผอ.สพท.</dt>
            <dd className="sm:col-span-2">
              {request.commanderComment} · {formatDateTime(request.grantDate)}
            </dd>
          </div>
        ) : null}
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ยื่นเมื่อ</dt>
          <dd className="sm:col-span-2">{formatDateTime(request.createdAt)}</dd>
        </div>
      </dl>

      {statsRows ? (
        <LeaveStatisticsTable
          rows={statsRows}
          selectedLeaveType={request.leaveType}
          relaxCollect={request.relaxCollect}
          relaxThisYear={request.relaxThisYear}
        />
      ) : null}

      {canApprove ? (
        <LeaveApproveForm
          action={approveLeaveStep.bind(null, id)}
          step={workflow}
        />
      ) : null}
    </section>
  );
}
