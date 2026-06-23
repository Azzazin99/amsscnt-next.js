import Link from "next/link";
import { notFound } from "next/navigation";
import { PermissionApproveForm } from "@/components/permission/permission-approve-form";
import { approvePermissionRequest } from "@/lib/permission/actions";
import { grantStatusLabel } from "@/lib/permission/constants";
import { canApprovePermission } from "@/lib/permission/permissions";
import {
  canViewPermissionRequest,
  getPermissionRequest,
} from "@/lib/permission/queries";
import { requirePermissionScope } from "@/lib/permission/scope";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDateTime(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

export default async function PermissionRequestDetailPage({ params }: Props) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const { user, perms, scope } = await requirePermissionScope();
  const request = await getPermissionRequest(id);
  if (!request || !canViewPermissionRequest(request, scope, user.personId)) {
    notFound();
  }

  const canApprove =
    canApprovePermission(user, perms) && request.grantStatus === null;

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">
          รายละเอียดคำขอไปราชการ
        </h2>
        <Link
          href="/modules/permission/requests"
          className="text-sm text-primary hover:underline"
        >
          ← กลับรายการ
        </Link>
      </div>

      <dl className="divide-y rounded-xl border bg-card shadow-sm">
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">เลขที่</dt>
          <dd className="font-mono text-sm sm:col-span-2">{request.refId}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ผู้ขอ</dt>
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
          <dt className="text-sm text-muted-foreground">เรื่อง</dt>
          <dd className="sm:col-span-2">{request.subject}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">สถานที่</dt>
          <dd className="sm:col-span-2">{request.place}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ช่วงวันไปราชการ</dt>
          <dd className="sm:col-span-2">
            {request.travelStart} – {request.travelFinish} ({request.travelDays}{" "}
            วัน)
          </dd>
        </div>
        {request.vehicle ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">พาหนะ</dt>
            <dd className="sm:col-span-2">{request.vehicle}</dd>
          </div>
        ) : null}
        {request.document ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">เอกสารแนบ</dt>
            <dd className="sm:col-span-2">{request.document}</dd>
          </div>
        ) : null}
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">สถานะ</dt>
          <dd className="sm:col-span-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                request.grantStatus === 1
                  ? "bg-green-100 text-green-800"
                  : request.grantStatus === 0
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800",
              )}
            >
              {grantStatusLabel(request.grantStatus)}
            </span>
          </dd>
        </div>
        {request.grantComment ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">ความเห็นผู้บังคับบัญชา</dt>
            <dd className="sm:col-span-2">{request.grantComment}</dd>
          </div>
        ) : null}
        {request.grantDate ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">วันที่พิจารณา</dt>
            <dd className="sm:col-span-2">{formatDateTime(request.grantDate)}</dd>
          </div>
        ) : null}
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ยื่นเมื่อ</dt>
          <dd className="sm:col-span-2">{formatDateTime(request.createdAt)}</dd>
        </div>
      </dl>

      {canApprove ? (
        <PermissionApproveForm
          action={approvePermissionRequest.bind(null, id)}
        />
      ) : null}
    </section>
  );
}
