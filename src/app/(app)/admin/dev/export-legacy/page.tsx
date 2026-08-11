import { DbBrowserBanner } from "@/components/dev/db-browser-banner";
import { LegacyDumpExportPanel } from "@/components/dev/legacy-dump-export-panel";
import {
  assertPgDumpAvailable,
  countLegacyTables,
  getAppTableNames,
  requireLegacyDumpExport,
} from "@/lib/dev/legacy-dump-export";

export default async function ExportLegacyPage() {
  await requireLegacyDumpExport();

  const [legacyTableCount, pgDumpOk] = await Promise.all([
    countLegacyTables(),
    assertPgDumpAvailable()
      .then(() => true as const)
      .catch((err: unknown) =>
        err instanceof Error ? err.message : "pg_dump unavailable",
      ),
  ]);

  return (
    <section className="space-y-4">
      <DbBrowserBanner />

      <div>
        <h2 className="text-lg font-semibold text-primary">ส่งออก Legacy dump</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ดาวน์โหลด SQL ตาราง legacy เท่านั้น (ไม่รวมตาราง app Drizzle) —
          ใช้กับ <code className="text-xs">npm run db:load-legacy</code> บนเครื่องอื่น
        </p>
      </div>

      <LegacyDumpExportPanel
        legacyTableCount={legacyTableCount}
        excludedAppTableCount={getAppTableNames().size}
        pgDumpOk={pgDumpOk}
        downloadHref="/api/admin/legacy-dump"
      />
    </section>
  );
}
