import Link from "next/link";
import { DbBrowserBanner } from "@/components/dev/db-browser-banner";
import { DbTableSearch } from "@/components/dev/db-table-search";
import {
  listPublicTables,
  requireDevDbBrowser,
  type DbTableSummary,
} from "@/lib/dev/db-browser";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

function TableGroup({
  title,
  tables,
}: {
  title: string;
  tables: DbTableSummary[];
}) {
  if (tables.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-primary">
        {title}{" "}
        <span className="font-normal text-muted-foreground">
          ({tables.length.toLocaleString("th-TH")} ตาราง)
        </span>
      </h3>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-3 py-2.5 font-medium">ตาราง</th>
              <th className="px-3 py-2.5 font-medium text-right">แถว (ประมาณ)</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((row) => (
              <tr key={row.name} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5">
                  <Link
                    href={`/admin/dev/database/${encodeURIComponent(row.name)}`}
                    className="font-mono text-sm text-primary underline-offset-2 hover:underline"
                  >
                    {row.name}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                  {row.rowEstimate.toLocaleString("th-TH")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function DevDatabasePage({ searchParams }: Props) {
  await requireDevDbBrowser();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const tables = await listPublicTables(q);
  const appTables = tables.filter((t) => t.kind === "app");
  const legacyTables = tables.filter((t) => t.kind === "legacy");

  return (
    <section className="space-y-4">
      <DbBrowserBanner />

      <div>
        <h2 className="text-lg font-semibold text-primary">ดูฐานข้อมูล</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ตารางใน schema <code className="text-xs">public</code> — อ่านอย่างเดียว
        </p>
      </div>

      <DbTableSearch defaultQ={q} />

      {tables.length === 0 ? (
        <p className="text-sm text-muted-foreground">ไม่พบตารางที่ตรงกับคำค้น</p>
      ) : (
        <div className="space-y-6">
          <TableGroup title="App (Drizzle)" tables={appTables} />
          <TableGroup title="Legacy (dump)" tables={legacyTables} />
        </div>
      )}
    </section>
  );
}
