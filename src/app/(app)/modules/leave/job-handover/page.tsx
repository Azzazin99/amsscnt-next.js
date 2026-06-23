import { ListPagination } from "@/components/core/list-pagination";
import { LeaveJobHandoverButton } from "@/components/leave/leave-job-handover-button";
import { LeaveRequestQueueTable } from "@/components/leave/leave-request-queue-table";
import { PAGE_SIZE } from "@/lib/leave/queries";
import {
  countJobHandover,
  listJobHandoverPage,
  resolveInboxPage,
} from "@/lib/leave/inbox-queries";
import { requireLeaveScope } from "@/lib/leave/scope";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function LeaveJobHandoverPage({ searchParams }: Props) {
  const { user, scope } = await requireLeaveScope();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const total = await countJobHandover(scope, user.personId);
  const resolvedPage = await resolveInboxPage(total, page);
  const rows = await listJobHandoverPage({
    scope,
    viewerPersonId: user.personId,
    page: resolvedPage,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">รับมอบงาน</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          คำขอลาที่มอบหมายให้ท่านรับงานแทน — {total.toLocaleString("th-TH")} รายการ
        </p>
      </div>

      <LeaveRequestQueueTable
        rows={rows}
        showSchool={scope.kind === "district"}
        renderRowAction={(row) => <LeaveJobHandoverButton requestId={row.id} />}
      />

      <ListPagination
        page={resolvedPage}
        totalPages={totalPages}
        basePath="/modules/leave/job-handover"
      />
    </section>
  );
}
