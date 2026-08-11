import Link from "next/link";
import { notFound } from "next/navigation";
import { PermissionApproveForm } from "@/components/permission/permission-approve-form";
import { PermissionBasicCommentForm } from "@/components/permission/permission-basic-comment-form";
import {
  approvePermissionRequest,
  basicCommentPermissionRequest,
} from "@/lib/permission/actions";
import {
  basicGrantStatusLabel,
  grantStatusLabel,
  permissionWorkflowStatusLabel,
} from "@/lib/permission/constants";
import { getPermissionPersonSettings } from "@/lib/permission/grant-persons-queries";
import { isPermissionModuleAdmin } from "@/lib/permission/permissions";
import {
  canViewPermissionRequest,
  getPermissionRequest,
  listPermissionRequestFiles,
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

  const { user, scope } = await requirePermissionScope();
  const request = await getPermissionRequest(id);
  if (!request || !canViewPermissionRequest(request, scope, user.personId)) {
    notFound();
  }

  const [settings, files] = await Promise.all([
    getPermissionPersonSettings(request.personId),
    listPermissionRequestFiles(id),
  ]);
  const isAdmin = isPermissionModuleAdmin(user);

  const canBasic =
    request.basicGrant === null &&
    (isAdmin || settings?.groupPersonId === user.personId);

  const canGrant =
    request.basicGrant === 1 &&
    request.grantStatus === null &&
    (isAdmin || settings?.grantPersonId === user.personId);

  const workflowLabel = permissionWorkflowStatusLabel({
    basicGrant: request.basicGrant,
    grantStatus: request.grantStatus,
  });

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">
          รายละเอียดคำขอไปราชการ
        </h2>
        <Link
          href="/modules/permission/reports/all"
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
        {files.length > 0 ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted-foreground">เอกสารแนบ</dt>
            <dd className="sm:col-span-2 space-y-1">
              {files.map((file) => (
                <div key={file.id}>
                  <a
                    href={`/api/permission/requests/${request.id}/files/${file.id}`}
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {file.fileDes || file.fileName}
                  </a>
                </div>
              ))}
            </dd>
          </div>
        ) : request.document ? (
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
                  : request.grantStatus === 0 || request.basicGrant === 0
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800",
              )}
            >
              {workflowLabel}
            </span>
          </dd>
        </div>
        {request.basicGrant !== null ? (
          <>
            <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
              <dt className="text-sm text-muted-foreground">ความเห็นชั้นต้น</dt>
              <dd className="sm:col-span-2">
                {basicGrantStatusLabel(request.basicGrant)}
                {request.basicComment ? ` — ${request.basicComment}` : ""}
              </dd>
            </div>
            {request.basicAt ? (
              <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
                <dt className="text-sm text-muted-foreground">วันที่เห็นชอบ</dt>
                <dd className="sm:col-span-2">
                  {formatDateTime(request.basicAt)}
                </dd>
              </div>
            ) : null}
          </>
        ) : null}
        {request.grantStatus !== null ? (
          <>
            <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
              <dt className="text-sm text-muted-foreground">ผลอนุมัติ</dt>
              <dd className="sm:col-span-2">
                {grantStatusLabel(request.grantStatus)}
              </dd>
            </div>
            {request.grantComment ? (
              <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
                <dt className="text-sm text-muted-foreground">ความเห็นผู้อนุมัติ</dt>
                <dd className="sm:col-span-2">{request.grantComment}</dd>
              </div>
            ) : null}
            {request.grantDate ? (
              <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
                <dt className="text-sm text-muted-foreground">วันที่อนุมัติ</dt>
                <dd className="sm:col-span-2">
                  {formatDateTime(request.grantDate)}
                </dd>
              </div>
            ) : null}
          </>
        ) : null}
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-3">
          <dt className="text-sm text-muted-foreground">ยื่นเมื่อ</dt>
          <dd className="sm:col-span-2">{formatDateTime(request.createdAt)}</dd>
        </div>
      </dl>

      {canBasic ? (
        <PermissionBasicCommentForm
          action={basicCommentPermissionRequest.bind(null, id)}
        />
      ) : null}

      {canGrant ? (
        <PermissionApproveForm
          action={approvePermissionRequest.bind(null, id)}
        />
      ) : null}
    </section>
  );
}
