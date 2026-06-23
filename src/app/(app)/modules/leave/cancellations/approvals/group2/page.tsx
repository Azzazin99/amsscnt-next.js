import { redirect } from "next/navigation";
import { ListPagination } from "@/components/core/list-pagination";
import { LeaveRequestQueueTable } from "@/components/leave/leave-request-queue-table";
import { canAccessGroup2CancellationApprovalInbox } from "@/lib/leave/approval-nav";
import {
  countGroup2CancellationApproval,
  listGroup2CancellationApprovalPage,
} from "@/lib/leave/cancellation-inbox-queries";
import { PAGE_SIZE, resolveLeaveListPage } from "@/lib/leave/queries";
import { requireLeaveScope } from "@/lib/leave/scope";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function LeaveCancellationGroup2ApprovalPage({
  searchParams,
}: Props) {
  const { user, scope } = await requireLeaveScope();
  if (scope.kind !== "district") {
    redirect("/modules/leave/cancellations");
  }
  if (!(await canAccessGroup2CancellationApprovalInbox(user))) {
    redirect("/modules/leave/cancellations");
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const total = await countGroup2CancellationApproval(user.personId);
  const resolvedPage = await resolveLeaveListPage(total, page);
  const rows = await listGroup2CancellationApprovalPage({
    viewerPersonId: user.personId,
    page: resolvedPage,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          รอง ผอ.สพท. (อนุมัติยกเลิก)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          คำขอยกเลิกวันลาบุคลากรเขตรออนุมัติ — {total.toLocaleString("th-TH")}{" "}
          รายการ
        </p>
      </div>

      <LeaveRequestQueueTable
        rows={rows}
        dateColumnLabel="ช่วงที่ยกเลิก"
        getDetailHref={(row) => `/modules/leave/cancellations/${row.id}`}
      />

      <ListPagination
        page={resolvedPage}
        totalPages={totalPages}
        basePath="/modules/leave/cancellations/approvals/group2"
      />
    </section>
  );
}
