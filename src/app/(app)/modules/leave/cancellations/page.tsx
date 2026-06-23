import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { formatThaiDate } from "@/lib/format/thai-date";
import { LeaveCancellationListFilters } from "@/components/leave/leave-cancellation-list-filters";
import { buildLeaveCancellationsUrl } from "@/lib/leave/cancellation-list-url";
import {
  PAGE_SIZE,
  countLeaveCancellations,
  listLeaveCancellationsPage,
  parseLeaveListParams,
  resolveLeaveListPage,
} from "@/lib/leave/queries";
import { canWriteLeaveRequest } from "@/lib/leave/permissions";
import { requireLeaveScope } from "@/lib/leave/scope";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    leaveType?: string;
    grant?: string;
  }>;
};

function grantBadgeClass(grant: number | null): string {
  if (grant === 1) {
    return "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200";
  }
  if (grant === 0) {
    return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200";
}

export default async function LeaveCancellationsPage({ searchParams }: Props) {
  const { user, perms, scope } = await requireLeaveScope();
  const params = await searchParams;
  const parsed = parseLeaveListParams(params);
  const canWrite = canWriteLeaveRequest(user, perms);

  const total = await countLeaveCancellations(
    scope,
    user.personId,
    parsed.q,
    parsed.leaveType,
    parsed.grant,
  );
  const page = await resolveLeaveListPage(total, parsed.page);
  const rows = await listLeaveCancellationsPage({
    scope,
    viewerPersonId: user.personId,
    page,
    q: parsed.q,
    leaveType: parsed.leaveType,
    grant: parsed.grant,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">ขอยกเลิกวันลา</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString("th-TH")} รายการ
          </p>
        </div>
        {canWrite ? (
          <Link
            href="/modules/leave/cancellations/new"
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            บันทึกขอยกเลิกวันลา
          </Link>
        ) : null}
      </div>

      <LeaveCancellationListFilters
        q={parsed.q}
        leaveType={parsed.leaveType}
        grant={parsed.grant}
      />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ผู้ลา</th>
              <th className="px-3 py-3 font-medium">ประเภท</th>
              <th className="px-3 py-3 font-medium">ช่วงลาที่อนุมัติ</th>
              <th className="px-3 py-3 font-medium">ช่วงที่ยกเลิก</th>
              <th className="px-3 py-3 text-center font-medium">วันยกเลิก</th>
              <th className="px-3 py-3 text-center font-medium">สถานะ</th>
              <th className="px-3 py-3 text-center font-medium">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ไม่พบคำขอยกเลิกวันลา
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">
                    <div>{row.displayName}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {row.personId}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">{row.leaveTypeLabel}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {formatThaiDate(row.permissionStart)} –{" "}
                    {formatThaiDate(row.permissionFinish)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {formatThaiDate(row.cancelStart)} –{" "}
                    {formatThaiDate(row.cancelFinish)}
                  </td>
                  <td className="px-3 py-2.5 text-center">{row.cancelTotal}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        grantBadgeClass(row.commanderGrant),
                      )}
                    >
                      {row.workflowStatusLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/leave/cancellations/${row.id}`}
                      className="text-primary hover:underline"
                    >
                      ดู
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefForPage={(p) =>
          buildLeaveCancellationsUrl({
            page: p,
            q: parsed.q,
            leaveType: parsed.leaveType,
            grant: parsed.grant,
          })
        }
      />
    </section>
  );
}
