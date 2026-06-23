import Link from "next/link";
import { Pencil } from "lucide-react";
import { ListPagination } from "@/components/core/list-pagination";
import { UsersListFilters } from "@/components/core/users-list-filters";
import { buttonVariants } from "@/components/ui/button";
import { buildUsersListUrl } from "@/lib/core/users/list-url";
import {
  USERS_PAGE_SIZE,
  countUsers,
  listUsersPage,
  parseUserListParams,
  resolveUserListPage,
} from "@/lib/core/users/queries";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<{ page?: string; q?: string; status?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const parsed = parseUserListParams(params);
  const page = await resolveUserListPage(parsed);

  const [rows, total] = await Promise.all([
    listUsersPage({ ...parsed, page }),
    countUsers(parsed.q, parsed.status),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">ผู้ใช้งาน</h2>
          <p className="mt-1 text-sm text-muted-foreground">เทียบ system_user — {total.toLocaleString("th-TH")} บัญชี</p>
        </div>
        <Link href="/admin/users/new" className={cn(buttonVariants(), "inline-flex min-h-11")}>เพิ่มผู้ใช้</Link>
      </div>

      <UsersListFilters q={parsed.q} status={parsed.status} />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">username</th>
              <th className="px-3 py-3 font-medium">ชื่อ</th>
              <th className="px-3 py-3 font-medium">ระดับ</th>
              <th className="px-3 py-3 font-medium">สถานศึกษา</th>
              <th className="px-3 py-3 text-center font-medium">admin</th>
              <th className="px-3 py-3 text-center font-medium">สถานะ</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                <td className="px-3 py-2.5 font-mono text-xs">{row.username}</td>
                <td className="px-3 py-2.5">{row.name}</td>
                <td className="px-3 py-2.5">{row.organizationType === "school" ? "โรงเรียน" : "เขต"}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{row.schoolName ?? "—"}</td>
                <td className="px-3 py-2.5 text-center">{row.isAdmin ? "✓" : "—"}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", row.status === 1 ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200" : "bg-muted text-muted-foreground")}>
                    {row.status === 1 ? "ใช้งาน" : "ปิด"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Link href={`/admin/users/${row.id}/edit`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted" aria-label="แก้ไข">
                    <Pencil className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefForPage={(p) => buildUsersListUrl({ ...parsed, page: p })}
      />
    </section>
  );
}
