import Link from "next/link";
import { ListPagination } from "@/components/core/list-pagination";
import { ModuleAdminDeleteButton } from "@/components/core/module-admin-delete-button";
import { buttonVariants } from "@/components/ui/button";
import { deleteModuleAdmin } from "@/lib/core/module-admins/actions";
import { buildModuleAdminsListUrl } from "@/lib/core/module-admins/list-url";
import {
  MODULE_ADMINS_PAGE_SIZE,
  countModuleAdmins,
  listModuleAdminsPage,
  parseModuleAdminListParams,
  resolveModuleAdminListPage,
} from "@/lib/core/module-admins/queries";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<{ page?: string; q?: string }> };

export default async function AdminModuleAdminsPage({ searchParams }: Props) {
  const params = await searchParams;
  const parsed = parseModuleAdminListParams(params);
  const page = await resolveModuleAdminListPage(parsed);

  const [rows, total] = await Promise.all([
    listModuleAdminsPage({ ...parsed, page }),
    countModuleAdmins(parsed.q),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / MODULE_ADMINS_PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">ผู้ดูแลโมดูล</h2>
          <p className="mt-1 text-sm text-muted-foreground">เทียบ system_module_admin — {total} รายการ</p>
        </div>
        <Link href="/admin/module-admins/new" className={cn(buttonVariants(), "inline-flex min-h-11")}>เพิ่มผู้ดูแล</Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ผู้ใช้</th>
              <th className="px-3 py-3 font-medium">โมดูล</th>
              <th className="px-3 py-3 text-center font-medium">ลบ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">ไม่มีรายการ</td></tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs">{row.username}</span>
                    <span className="mx-1 text-muted-foreground">·</span>
                    {row.userName}
                  </td>
                  <td className="px-3 py-2.5">{row.moduleName ?? row.moduleSlug}</td>
                  <td className="px-3 py-2.5 text-center">
                    <ModuleAdminDeleteButton id={row.id} deleteAction={deleteModuleAdmin} />
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
        hrefForPage={(p) => buildModuleAdminsListUrl({ ...parsed, page: p })}
      />
    </section>
  );
}
