import { redirect } from "next/navigation";
import { ListPagination } from "@/components/core/list-pagination";
import { PermissionRequestQueueTable } from "@/components/permission/permission-request-queue-table";
import { canAccessGrantApprovalInbox } from "@/lib/permission/approval-nav";
import { PAGE_SIZE } from "@/lib/permission/queries";
import {
  countGrantApproval,
  listGrantApprovalPage,
  resolveInboxPage,
} from "@/lib/permission/inbox-queries";
import { requirePermissionScope } from "@/lib/permission/scope";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function PermissionGrantApprovalPage({
  searchParams,
}: Props) {
  const { user, scope } = await requirePermissionScope();
  if (!(await canAccessGrantApprovalInbox(user))) {
    redirect("/modules/permission/requests");
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const total = await countGrantApproval(scope, user.personId);
  const resolvedPage = await resolveInboxPage(total, page);
  const rows = await listGrantApprovalPage({
    scope,
    viewerPersonId: user.personId,
    page: resolvedPage,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          ผู้บังคับบัญชา (ผู้อนุมัติ)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          คำขอรออนุมัติขั้นสุดท้าย — {total.toLocaleString("th-TH")} รายการ
        </p>
      </div>

      <PermissionRequestQueueTable
        rows={rows}
        showSchool={scope.kind === "district"}
      />

      <ListPagination
        page={resolvedPage}
        totalPages={totalPages}
        basePath="/modules/permission/approvals/grant"
      />
    </section>
  );
}
