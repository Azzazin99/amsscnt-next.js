import { redirect } from "next/navigation";
import { ListPagination } from "@/components/core/list-pagination";
import { LeaveRequestQueueTable } from "@/components/leave/leave-request-queue-table";
import { canAccessCommanderApprovalInbox } from "@/lib/leave/approval-nav";
import { PAGE_SIZE } from "@/lib/leave/queries";
import {
  countCommanderApproval,
  listCommanderApprovalPage,
  resolveInboxPage,
} from "@/lib/leave/inbox-queries";
import { requireLeaveScope } from "@/lib/leave/scope";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function LeaveCommanderApprovalPage({
  searchParams,
}: Props) {
  const { user, scope } = await requireLeaveScope();
  if (scope.kind !== "district") {
    redirect("/modules/leave/requests");
  }
  if (!(await canAccessCommanderApprovalInbox(user))) {
    redirect("/modules/leave/requests");
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const total = await countCommanderApproval(user.personId);
  const resolvedPage = await resolveInboxPage(total, page);
  const rows = await listCommanderApprovalPage({
    viewerPersonId: user.personId,
    page: resolvedPage,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          ผอ.สพท. (อนุมัติ — โรงเรียน)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          คำขอลาบุคลากรโรงเรียนรออนุมัติขั้นสุดท้าย —{" "}
          {total.toLocaleString("th-TH")} รายการ
        </p>
      </div>

      <LeaveRequestQueueTable rows={rows} />

      <ListPagination
        page={resolvedPage}
        totalPages={totalPages}
        basePath="/modules/leave/approvals/commander"
      />
    </section>
  );
}
