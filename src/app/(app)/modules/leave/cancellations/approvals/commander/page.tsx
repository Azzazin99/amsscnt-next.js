import { ListPagination } from "@/components/core/list-pagination";
import { LeaveRequestQueueTable } from "@/components/leave/leave-request-queue-table";
import {
  countCommanderCancellationApproval,
  listCommanderCancellationApprovalPage,
} from "@/lib/leave/cancellation-inbox-queries";
import { PAGE_SIZE, resolveLeaveListPage } from "@/lib/leave/queries";
import { requireLeaveScope } from "@/lib/leave/scope";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function LeaveCancellationCommanderApprovalPage({
  searchParams,
}: Props) {
  const { user } = await requireLeaveScope();

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const total = await countCommanderCancellationApproval(user.personId);
  const resolvedPage = await resolveLeaveListPage(total, page);
  const rows = await listCommanderCancellationApprovalPage({
    viewerPersonId: user.personId,
    page: resolvedPage,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          ผอ.สพท. (อนุมัติยกเลิก — โรงเรียน)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          คำขอยกเลิกวันลาบุคลากรโรงเรียนรออนุมัติ —{" "}
          {total.toLocaleString("th-TH")} รายการ
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
        basePath="/modules/leave/cancellations/approvals/commander"
      />
    </section>
  );
}
