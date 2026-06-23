import Link from "next/link";
import { Pencil } from "lucide-react";
import { ListPagination } from "@/components/core/list-pagination";
import { SchoolGroupsListFilters } from "@/components/core/school-groups-list-filters";
import { buttonVariants } from "@/components/ui/button";
import { buildSchoolGroupsListUrl } from "@/lib/core/school-groups/list-url";
import {
  SCHOOL_GROUPS_PAGE_SIZE,
  countSchoolGroups,
  listSchoolGroupsPage,
  parseSchoolGroupListParams,
  resolveSchoolGroupListPage,
} from "@/lib/core/school-groups/queries";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
};

export default async function AdminSchoolGroupsPage({ searchParams }: Props) {
  const params = await searchParams;
  const parsed = parseSchoolGroupListParams(params);
  const page = await resolveSchoolGroupListPage(parsed);

  const [rows, total] = await Promise.all([
    listSchoolGroupsPage({ ...parsed, page }),
    countSchoolGroups(parsed.q),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / SCHOOL_GROUPS_PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">กลุ่มสถานศึกษา</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ศูนย์ประสานงานทางการศึกษา —{" "}
            {total.toLocaleString("th-TH")} กลุ่ม
          </p>
        </div>
        <Link
          href="/admin/school-groups/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มกลุ่ม
        </Link>
      </div>

      <SchoolGroupsListFilters q={parsed.q} />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ลำดับ</th>
              <th className="px-3 py-3 font-medium">ชื่อกลุ่ม</th>
              <th className="px-3 py-3 text-center font-medium">สถานศึกษา</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  {parsed.q.length > 0 && parsed.q.length < 2
                    ? "พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา"
                    : "ไม่พบกลุ่ม — ลองเปลี่ยนตัวกรองหรือเพิ่มรายการใหม่"}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">
                    {(page - 1) * SCHOOL_GROUPS_PAGE_SIZE + index + 1}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {row.sortOrder}
                  </td>
                  <td className="px-3 py-2.5">{row.name}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {row.schoolCount.toLocaleString("th-TH")}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/admin/school-groups/${row.id}/edit`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted"
                      title="แก้ไข"
                      aria-label="แก้ไข"
                    >
                      <Pencil className="size-4" />
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
        hrefForPage={(p) => buildSchoolGroupsListUrl({ ...parsed, page: p })}
      />
    </section>
  );
}
