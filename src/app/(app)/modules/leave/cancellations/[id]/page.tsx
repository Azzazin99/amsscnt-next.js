import Link from "next/link";
import { notFound } from "next/navigation";
import { LeaveApproveForm } from "@/components/leave/leave-approve-form";
import {
  approveLeaveCancellationStep,
} from "@/lib/leave/actions";
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
  canViewLeaveCancellation,
  getLeaveCancellation,
  getLeavePersonSettings,
} from "@/lib/leave/queries";
import { requireLeaveScope } from "@/lib/leave/scope";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDateTime(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

export default async function LeaveCancellationDetailPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const { user, perms, scope } = await requireLeaveScope();
  const cancellation = await getLeaveCancellation(id);
  if (
    !cancellation ||
    !canViewLeaveCancellation(cancellation, scope, user.personId)
  ) {
    notFound();
  }

  const signers = await getLeavePersonSettings(cancellation.personId);
  const workflow = currentWorkflowStatus({
    schoolId: cancellation.schoolId,
    groupDate: cancellation.groupDate,
    commanderGrant: cancellation.commanderGrant,
  });
  const userPerms = await getLeavePermissions(Number(user.id));

  const canApprove =
    (workflow === "group" ||
      workflow === "group2" ||
      workflow === "commander") &&
    canApproveLeaveStep(user, userPerms, workflow, signers, {
      isSchoolPersonnelRequest: cancellation.schoolId != null,
    });

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">
          รายละเอียดคำขอยกเลิกวันลา
        </h2>
        <Link
          href="/modules/leave/cancellations"
          className="text-sm text-primary hover:underline"
        >
          ← กลับรายการ
        </Link>
      </div>

      <dl className="divide-y rounded-xl border bg-card shadow-sm">
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ผู้ลา</dt>
          <dd className="sm:col-span-2">{cancellation.displayName}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">อ้างอิงคำขอลา</dt>
          <dd className="sm:col-span-2">
            <Link
              href={`/modules/leave/requests/${cancellation.sourceRequestId}`}
              className="text-primary hover:underline"
            >
              คำขอลา #{cancellation.sourceRequestId}
            </Link>
          </dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ประเภทลา</dt>
          <dd className="sm:col-span-2">
            {leaveTypeLabel(cancellation.leaveType)}
          </dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ช่วงลาที่อนุมัติ</dt>
          <dd className="sm:col-span-2">
            {formatThaiDate(cancellation.permissionStart)} –{" "}
            {formatThaiDate(cancellation.permissionFinish)} (
            {cancellation.permissionTotal} วัน)
          </dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ช่วงที่ขอยกเลิก</dt>
          <dd className="sm:col-span-2">
            {formatThaiDate(cancellation.cancelStart)} –{" "}
            {formatThaiDate(cancellation.cancelFinish)} ({cancellation.cancelTotal}{" "}
            วัน)
          </dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">เหตุผล</dt>
          <dd className="sm:col-span-2">{cancellation.because}</dd>
        </div>
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
          </dd>
        </div>
        {cancellation.groupDate ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">ผอ.กลุ่ม</dt>
            <dd className="sm:col-span-2">
              {cancellation.groupComment ?? "—"} ·{" "}
              {formatDateTime(cancellation.groupDate)}
            </dd>
          </div>
        ) : null}
        {cancellation.commanderComment ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">
              {cancellation.schoolId != null ? "ผอ.สพท." : "รอง ผอ.สพท."}
            </dt>
            <dd className="sm:col-span-2">
              {cancellation.commanderComment} ·{" "}
              {formatDateTime(cancellation.grantDate)}
            </dd>
          </div>
        ) : null}
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ยื่นเมื่อ</dt>
          <dd className="sm:col-span-2">
            {formatDateTime(cancellation.createdAt)}
          </dd>
        </div>
      </dl>

      {canApprove ? (
        <LeaveApproveForm
          action={approveLeaveCancellationStep.bind(null, id)}
          step={workflow}
        />
      ) : null}
    </section>
  );
}
