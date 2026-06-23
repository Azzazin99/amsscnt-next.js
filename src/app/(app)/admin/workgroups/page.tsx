import Link from "next/link";
import { Pencil } from "lucide-react";
import { ListPagination } from "@/components/core/list-pagination";
import { WorkgroupsListFilters } from "@/components/core/workgroups-list-filters";
import { buttonVariants } from "@/components/ui/button";
import { buildWorkgroupsListUrl } from "@/lib/core/workgroups/list-url";
import {
  WORKGROUPS_PAGE_SIZE,
  countWorkgroups,
  listWorkgroupsPage,
  parseWorkgroupListParams,
  resolveWorkgroupListPage,
} from "@/lib/core/workgroups/queries";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
  }>;
};

export default async function AdminWorkgroupsPage({ searchParams }: Props) {
  const params = await searchParams;
  const parsed = parseWorkgroupListParams(params);
  const page = await resolveWorkgroupListPage(parsed);

  const [rows, total] = await Promise.all([
    listWorkgroupsPage({ ...parsed, page }),
    countWorkgroups(parsed.q, parsed.status),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / WORKGROUPS_PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">กลุ่มงาน</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            เทียบ <code className="text-xs">system_workgroup</code> —{" "}
            {total.toLocaleString("th-TH")} กลุ่ม
          </p>
        </div>
        <Link
          href="/admin/workgroups/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มกลุ่มงาน
        </Link>
      </div>

      <WorkgroupsListFilters q={parsed.q} status={parsed.status} />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ลำดับ</th>
              <th className="px-3 py-3 font-medium">ชื่อกลุ่มงาน</th>
              <th className="px-3 py-3 text-center font-medium">บุคลากร</th>
              <th className="px-3 py-3 text-center font-medium">สถานะ</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  {parsed.q.length > 0 && parsed.q.length < 2
                    ? "พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา"
                    : "ไม่พบกลุ่มงาน — ลองเปลี่ยนตัวกรองหรือเพิ่มรายการใหม่"}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">
                    {(page - 1) * WORKGROUPS_PAGE_SIZE + index + 1}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {row.sortOrder}
                  </td>
                  <td className="px-3 py-2.5">{row.name}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {row.peopleCount.toLocaleString("th-TH")}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        row.active
                          ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {row.active ? "ใช้งาน" : "ปิด"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/admin/workgroups/${row.id}/edit`}
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
        hrefForPage={(p) => buildWorkgroupsListUrl({ ...parsed, page: p })}
      />
    </section>
  );
}
