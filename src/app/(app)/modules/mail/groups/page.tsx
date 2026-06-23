import Link from "next/link";
import { Pencil } from "lucide-react";
import { ListPagination } from "@/components/core/list-pagination";
import { buttonVariants } from "@/components/ui/button";
import { buildMailGroupsUrl } from "@/lib/mail/list-url";
import {
  countMailGroups,
  listMailGroupsPage,
  parseMailGroupListParams,
  resolveMailGroupListPage,
  MAIL_GROUPS_PAGE_SIZE,
} from "@/lib/mail/groups/queries";
import { requireMailSettingsAccess } from "@/lib/mail/scope";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function MailGroupsPage({ searchParams }: Props) {
  await requireMailSettingsAccess();
  const params = await searchParams;
  const parsed = parseMailGroupListParams(params);
  const total = await countMailGroups(parsed.q);
  const page = await resolveMailGroupListPage(total, parsed.page);
  const rows = await listMailGroupsPage({ ...parsed, page });
  const totalPages = Math.max(1, Math.ceil(total / MAIL_GROUPS_PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">กลุ่มบุคลากร</h2>
        <Link
          href="/modules/mail/groups/new"
          className={cn(buttonVariants(), "inline-flex min-h-11")}
        >
          เพิ่มกลุ่ม
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ชื่อกลุ่ม</th>
              <th className="px-3 py-3 font-medium">สมาชิก</th>
              <th className="px-3 py-3 font-medium">ลำดับ</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  ยังไม่มีกลุ่ม — กด &quot;เพิ่มกลุ่ม&quot;
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/20"}
                >
                  <td className="px-3 py-2.5">{row.name}</td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {row.memberCount.toLocaleString("th-TH")}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{row.sortOrder}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/modules/mail/groups/${row.id}/edit`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted"
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
        hrefForPage={(p) => buildMailGroupsUrl({ ...parsed, page: p })}
      />
    </section>
  );
}
