import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { AffairDeleteButton } from "@/components/affair/affair-delete-button";
import { AffairListFilters } from "@/components/affair/affair-list-filters";
import { buttonVariants } from "@/components/ui/button";
import { buildAffairListUrl } from "@/lib/affair/list-url";
import {
  AFFAIR_PAGE_SIZE,
  countAffairEntries,
  listAffairEntriesPage,
  parseAffairListParams,
  resolveAffairListPage,
} from "@/lib/affair/queries";
import {
  canWriteAffair,
  getAffairPermissions,
} from "@/lib/affair/permissions";
import { requireAffairScope } from "@/lib/affair/scope";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function AffairListPage({ searchParams }: Props) {
  const { user } = await requireAffairScope();
  const perms = await getAffairPermissions(Number(user.id));
  const canWrite = canWriteAffair(user, perms);

  const params = await searchParams;
  const parsed = parseAffairListParams(params);
  const total = await countAffairEntries(parsed.q);
  const page = await resolveAffairListPage(total, parsed.page);
  const rows = await listAffairEntriesPage({ page, q: parsed.q });
  const totalPages = Math.max(1, Math.ceil(total / AFFAIR_PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            ภารกิจผู้บริหาร
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString("th-TH")} รายการ
          </p>
        </div>
        {canWrite ? (
          <Link
            href="/modules/affair/new"
            className={cn(buttonVariants(), "inline-flex min-h-11")}
          >
            เพิ่มภารกิจ
          </Link>
        ) : null}
      </div>

      <AffairListFilters q={parsed.q} />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">วันที่</th>
              <th className="px-3 py-3 font-medium">เวลา</th>
              <th className="px-3 py-3 font-medium">เรื่อง</th>
              <th className="px-3 py-3 font-medium">สถานที่</th>
              <th className="px-3 py-3 font-medium">ผู้ปฏิบัติ</th>
              <th className="px-3 py-3 font-medium">หมายเหตุ</th>
              {canWrite ? (
                <>
                  <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
                  <th className="px-3 py-3 text-center font-medium">ลบ</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={canWrite ? 8 : 6}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ไม่พบรายการภารกิจ
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {row.affairDate}
                  </td>
                  <td className="px-3 py-2.5">{row.affairTime}</td>
                  <td className="px-3 py-2.5">{row.subject}</td>
                  <td className="px-3 py-2.5">{row.location}</td>
                  <td className="px-3 py-2.5">{row.operationPersonLabel}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {row.remark ?? "—"}
                  </td>
                  {canWrite ? (
                    <>
                      <td className="px-3 py-2.5 text-center">
                        <Link
                          href={`/modules/affair/${row.id}/edit`}
                          className="text-primary hover:underline"
                        >
                          แก้ไข
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <AffairDeleteButton id={row.id} />
                      </td>
                    </>
                  ) : null}
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
          buildAffairListUrl({ page: p, q: parsed.q || undefined })
        }
      />
    </section>
  );
}
