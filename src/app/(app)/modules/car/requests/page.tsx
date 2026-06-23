import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { CarListFilters } from "@/components/car/car-list-filters";
import { buildCarRequestsUrl } from "@/lib/car/list-url";
import {
  PAGE_SIZE,
  countCarRequests,
  listCarRequestsPage,
  parseCarListParams,
  resolveCarListPage,
} from "@/lib/car/queries";
import { requireCarScope } from "@/lib/car/scope";
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

export default async function CarRequestsPage({ searchParams }: Props) {
  await requireCarScope();
  const params = await searchParams;
  const parsed = parseCarListParams(params);

  const total = await countCarRequests(parsed.q, parsed.grant);
  const page = await resolveCarListPage(total, parsed.page);
  const rows = await listCarRequestsPage({
    page,
    q: parsed.q,
    grant: parsed.grant,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">คำขอใช้ยานพาหนะ</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString("th-TH")} รายการ
        </p>
      </div>

      <CarListFilters q={parsed.q} grant={parsed.grant} />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ผู้ขอ</th>
              <th className="px-3 py-3 font-medium">ยานพาหนะ</th>
              <th className="px-3 py-3 font-medium">สถานที่</th>
              <th className="px-3 py-3 font-medium">ช่วงวันที่</th>
              <th className="px-3 py-3 text-center font-medium">วัน</th>
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
                  ไม่พบคำขอ
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
                  <td className="px-3 py-2.5">{row.carLabel}</td>
                  <td className="px-3 py-2.5">{row.place}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {row.carStart} – {row.carFinish}
                  </td>
                  <td className="px-3 py-2.5 text-center">{row.dayTotal ?? "—"}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        grantBadgeClass(row.commanderGrant),
                      )}
                    >
                      {row.grantStatusLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/car/requests/${row.id}`}
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
          buildCarRequestsUrl({
            page: p,
            q: parsed.q,
            grant: parsed.grant,
          })
        }
      />
    </section>
  );
}
