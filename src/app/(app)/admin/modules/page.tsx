import Link from "next/link";
import { Pencil } from "lucide-react";
import { ListPagination } from "@/components/core/list-pagination";
import { ModulesListFilters } from "@/components/core/modules-list-filters";
import { buildModulesListUrl } from "@/lib/core/modules/list-url";
import {
  MODULES_PAGE_SIZE,
  countModules,
  listModulesPage,
  parseModuleListParams,
  resolveModuleListPage,
} from "@/lib/core/modules/queries";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
};

export default async function AdminModulesPage({ searchParams }: Props) {
  const params = await searchParams;
  const parsed = parseModuleListParams(params);
  const page = await resolveModuleListPage(parsed);

  const [rows, total] = await Promise.all([
    listModulesPage({ ...parsed, page }),
    countModules(parsed.q, parsed.status),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / MODULES_PAGE_SIZE));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">เปิด/ปิดโมดูล</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          เทียบ <code className="text-xs">system_module</code> — {total} โมดูล
        </p>
      </div>

      <ModulesListFilters q={parsed.q} status={parsed.status} />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-3 font-medium">ลำดับ</th>
              <th className="px-3 py-3 font-medium">slug</th>
              <th className="px-3 py-3 font-medium">ชื่อ</th>
              <th className="px-3 py-3 font-medium">กลุ่มเมนู</th>
              <th className="px-3 py-3 text-center font-medium">สถานะ</th>
              <th className="px-3 py-3 text-center font-medium">แก้ไข</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                <td className="px-3 py-2.5 font-mono text-xs">{row.sortOrder}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{row.slug}</td>
                <td className="px-3 py-2.5">{row.name}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{row.menuGroupName ?? "—"}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", row.active ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200" : "bg-muted text-muted-foreground")}>
                    {row.active ? "เปิด" : "ปิด"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Link href={`/admin/modules/${row.id}/edit`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-muted" aria-label="แก้ไข">
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
        hrefForPage={(p) => buildModulesListUrl({ ...parsed, page: p })}
      />
    </section>
  );
}
