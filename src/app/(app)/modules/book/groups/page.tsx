import Link from "next/link";
import { Pencil } from "lucide-react";
import { ListPagination } from "@/components/core/list-pagination";
import { buttonVariants } from "@/components/ui/button";
import { buildBookGroupsListUrl } from "@/lib/book/groups/list-url";
import {
  BOOK_GROUPS_PAGE_SIZE,
  countBookGroups,
  listBookGroupsPage,
  parseBookGroupListParams,
  resolveBookGroupListPage,
} from "@/lib/book/groups/queries";
import { canManageBookSettings } from "@/lib/book/permissions";
import { requireBookScope } from "@/lib/book/scope";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function BookGroupsPage({ searchParams }: Props) {
  const { user, perms } = await requireBookScope();
  if (!canManageBookSettings(user)) redirect("/modules/book/inbox");

  const params = await searchParams;
  const parsed = parseBookGroupListParams(params);
  const total = await countBookGroups(parsed.q);
  const page = await resolveBookGroupListPage(total, parsed.page);
  const rows = await listBookGroupsPage({ ...parsed, page });
  const totalPages = Math.max(1, Math.ceil(total / BOOK_GROUPS_PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">กลุ่มหนังสือ</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString("th-TH")} กลุ่ม — ใช้ส่งหนังสือถึงหลายโรงเรียน
          </p>
        </div>
        <Link
          href="/modules/book/groups/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มกลุ่ม
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ที่</th>
              <th className="px-3 py-3 font-medium">ลำดับ</th>
              <th className="px-3 py-3 font-medium">ชื่อกลุ่ม</th>
              <th className="px-3 py-3 text-center font-medium">โรงเรียน</th>
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
                  ไม่พบกลุ่ม — เพิ่มกลุ่มใหม่เพื่อใช้ส่งหนังสือ
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">
                    {(page - 1) * BOOK_GROUPS_PAGE_SIZE + index + 1}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {row.sortOrder}
                  </td>
                  <td className="px-3 py-2.5">{row.name}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {row.memberCount.toLocaleString("th-TH")}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/book/groups/${row.id}/edit`}
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
        hrefForPage={(p) => buildBookGroupsListUrl({ ...parsed, page: p })}
      />
    </section>
  );
}
