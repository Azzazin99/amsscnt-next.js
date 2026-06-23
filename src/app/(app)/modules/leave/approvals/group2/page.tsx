import { redirect } from "next/navigation";
import { ListPagination } from "@/components/core/list-pagination";
import { LeaveRequestQueueTable } from "@/components/leave/leave-request-queue-table";
import { canAccessGroup2ApprovalInbox } from "@/lib/leave/approval-nav";
import { PAGE_SIZE } from "@/lib/leave/queries";
import {
  countGroup2Approval,
  listGroup2ApprovalPage,
  resolveInboxPage,
} from "@/lib/leave/inbox-queries";
import { requireLeaveScope } from "@/lib/leave/scope";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function LeaveGroup2ApprovalPage({ searchParams }: Props) {
  const { user, scope } = await requireLeaveScope();
  if (scope.kind !== "district") {
    redirect("/modules/leave/requests");
  }
  if (!(await canAccessGroup2ApprovalInbox(user))) {
    redirect("/modules/leave/requests");
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const total = await countGroup2Approval(user.personId);
  const resolvedPage = await resolveInboxPage(total, page);
  const rows = await listGroup2ApprovalPage({
    viewerPersonId: user.personId,
    page: resolvedPage,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          รอง ผอ.สพท. (อนุมัติ)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          คำขอลาบุคลากรเขตรออนุมัติขั้นสุดท้าย — {total.toLocaleString("th-TH")}{" "}
          รายการ
        </p>
      </div>

      <LeaveRequestQueueTable rows={rows} />

      <ListPagination
        page={resolvedPage}
        totalPages={totalPages}
        basePath="/modules/leave/approvals/group2"
      />
    </section>
  );
}
