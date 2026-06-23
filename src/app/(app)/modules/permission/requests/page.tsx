import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { PermissionListFilters } from "@/components/permission/permission-list-filters";
import { buildPermissionRequestsUrl } from "@/lib/permission/list-url";
import {
  PAGE_SIZE,
  countPermissionRequests,
  listPermissionRequestsPage,
  parsePermissionListParams,
  resolvePermissionListPage,
} from "@/lib/permission/queries";
import { requirePermissionScope } from "@/lib/permission/scope";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
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

export default async function PermissionRequestsPage({ searchParams }: Props) {
  const { user, scope } = await requirePermissionScope();
  const params = await searchParams;
  const parsed = parsePermissionListParams(params);

  const total = await countPermissionRequests(
    scope,
    user.personId,
    parsed.q,
    parsed.grant,
  );
  const page = await resolvePermissionListPage(total, parsed.page);
  const rows = await listPermissionRequestsPage({
    scope,
    viewerPersonId: user.personId,
    page,
    q: parsed.q,
    grant: parsed.grant,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">คำขอไปราชการ</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString("th-TH")} รายการ
        </p>
      </div>

      <PermissionListFilters q={parsed.q} grant={parsed.grant} />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ผู้ขอ</th>
              <th className="px-3 py-3 font-medium">หน่วยงาน</th>
              <th className="px-3 py-3 font-medium">เรื่อง</th>
              <th className="px-3 py-3 font-medium">สถานที่</th>
              <th className="px-3 py-3 font-medium">วันที่ไป</th>
              <th className="px-3 py-3 text-center font-medium">จำนวนวัน</th>
              <th className="px-3 py-3 text-center font-medium">สถานะ</th>
              <th className="px-3 py-3 text-center font-medium">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ไม่พบคำขอไปราชการ
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
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {row.schoolName ?? "เขตพื้นที่"}
                  </td>
                  <td className="px-3 py-2.5">{row.subject}</td>
                  <td className="px-3 py-2.5">{row.place}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {row.travelStart} – {row.travelFinish}
                  </td>
                  <td className="px-3 py-2.5 text-center">{row.travelDays}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        grantBadgeClass(row.grantStatus),
                      )}
                    >
                      {row.grantStatusLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/permission/requests/${row.id}`}
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
          buildPermissionRequestsUrl({
            page: p,
            q: parsed.q,
            grant: parsed.grant,
          })
        }
      />
    </section>
  );
}
