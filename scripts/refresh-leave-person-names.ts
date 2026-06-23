/**
 * Refresh legacy_leave_person stub names from person_main / person_sch_main.
 *
 * Use after merging Yasothon (or other) personnel into legacy tables.
 * Does not touch leave_* tables.
 *
 * Usage:
 *   npm run db:refresh-leave-person-names
 */
import "dotenv/config";
import { queryClient } from "../src/lib/db";
import { ensureLeavePeopleFromLegacy } from "./import/backfill-leave-people";
import { buildLeaveImportMapsFromDb } from "./import/leave-import-cli";
import { legacyTableExists } from "./import/shared";

async function main() {
  const hasLa = await legacyTableExists("la_year");
  if (!hasLa) {
    console.error("ไม่พบตาราง la_* — รัน npm run db:load-legacy ก่อน");
    process.exit(1);
  }

  const maps = await buildLeaveImportMapsFromDb();
  console.log("refresh legacy leave person names from person_main / person_sch_main...");
  const result = await ensureLeavePeopleFromLegacy(maps);

  console.log("people inserted:", result.inserted);
  console.log("people skipped (existing, no change):", result.skippedExisting);
  console.log("people names refreshed:", result.namesRefreshed);
  console.log("Done.");

  await queryClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
