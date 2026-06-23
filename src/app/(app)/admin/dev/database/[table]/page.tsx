import Link from "next/link";
import { notFound } from "next/navigation";
import { ListPagination } from "@/components/core/list-pagination";
import { DbBrowserBanner } from "@/components/dev/db-browser-banner";
import {
  DB_BROWSER_PAGE_SIZE,
  assertSafeTableName,
  clampPageSize,
  countTableRows,
  fetchTablePage,
  formatCellValue,
  getTableColumns,
  requireDevDbBrowser,
  resolveDbBrowserPage,
  tableExistsInPublic,
} from "@/lib/dev/db-browser";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  params: Promise<{ table: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function DevDatabaseTablePage({ params, searchParams }: Props) {
  await requireDevDbBrowser();

  const { table: rawTable } = await params;
  let table: string;
  try {
    table = assertSafeTableName(decodeURIComponent(rawTable));
  } catch {
    notFound();
  }

  if (!(await tableExistsInPublic(table))) notFound();

  const sp = await searchParams;
  const pageSize = clampPageSize(DB_BROWSER_PAGE_SIZE);
  const requestedPage = Math.max(1, Number(sp.page) || 1);

  const [columns, total] = await Promise.all([
    getTableColumns(table),
    countTableRows(table),
  ]);

  const page = resolveDbBrowserPage(total, requestedPage, pageSize);
  const displayRows = await fetchTablePage(table, { page, pageSize });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const basePath = `/admin/dev/database/${encodeURIComponent(table)}`;

  return (
    <section className="space-y-4">
      <DbBrowserBanner />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/dev/database"
            className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
          >
            ← รายการตาราง
          </Link>
          <h2 className="mt-3 font-mono text-lg font-semibold text-primary">{table}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString("th-TH")} แถว · {columns.length} คอลัมน์
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th key={col.name} className="whitespace-nowrap px-3 py-2.5 font-medium">
                  <span className="font-mono text-xs">{col.name}</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {col.dataType}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  ไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              displayRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-border align-top last:border-0"
                >
                  {columns.map((col) => (
                    <td
                      key={col.name}
                      className="max-w-xs break-all px-3 py-2 font-mono text-xs"
                    >
                      {formatCellValue(row[col.name])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ListPagination page={page} totalPages={totalPages} basePath={basePath} />
    </section>
  );
}
