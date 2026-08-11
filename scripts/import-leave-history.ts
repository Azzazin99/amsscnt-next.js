/**
 * Import leave module from legacy la_* tables into leave_* (idempotent).
 *
 * Usage:
 *   npm run db:import-leave
 *   npm run db:import-leave -- --fresh-leave   # truncate leave tables first
 *   npm run db:import-leave -- --skip-legacy-check
 *   npm run db:import-leave -- --no-backfill-leave-people
 */
import "dotenv/config";
import { queryClient } from "../src/lib/db";
import { importLeave } from "./import/import-leave";
import {
  buildLeaveImportMapsFromDb,
  truncateLeaveTables,
} from "./import/leave-import-cli";
import { legacyTableExists } from "./import/shared";

async function main() {
  const freshLeave = process.argv.includes("--fresh-leave");
  const skipLegacyCheck = process.argv.includes("--skip-legacy-check");
  const skipPeopleBackfill = process.argv.includes("--no-backfill-leave-people");

  if (!skipLegacyCheck) {
    const ok = await legacyTableExists("la_year");
    if (!ok) {
      console.error(
        "ไม่พบตาราง legacy la_* — รัน npm run db:load-legacy ก่อน\n" +
          "หรือส่ง --skip-legacy-check ถ้าโหลด legacy แล้ว",
      );
      process.exit(1);
    }
  }

  if (freshLeave) {
    console.log("truncate leave_* tables (--fresh-leave)...");
    await truncateLeaveTables();
  }

  const maps = await buildLeaveImportMapsFromDb();
  console.log("import leave from la_* ...");
  const result = await importLeave(maps, { skipPeopleBackfill });

  console.log("people backfilled:", result.peopleBackfilled);
  console.log(
    "people backfill skipped (existing):",
    result.peopleBackfillSkippedExisting,
  );
  console.log("people names refreshed:", result.peopleNamesRefreshed);
  console.log("leave_years:", result.years);
  console.log("leave_permissions:", result.permissions);
  console.log("leave_person_settings:", result.personSettings);
  console.log("leave_requests inserted:", result.requestsInserted);
  console.log("leave_requests skipped (existing):", result.requestsSkippedExisting);
  console.log(
    "leave_requests skipped (no person):",
    result.requestsSkippedNoPerson,
  );
  console.log("leave_cancellations inserted:", result.cancellationsInserted);
  console.log(
    "leave_cancellations skipped (existing):",
    result.cancellationsSkippedExisting,
  );
  console.log(
    "leave_cancellations skipped (no source):",
    result.cancellationsSkippedNoSource,
  );
  console.log(
    "leave_cancellations skipped (no person):",
    result.cancellationsSkippedNoPerson,
  );
  console.log("leave_quota_balances synced:", result.quotaBalancesSynced);
  console.log("Import leave complete.");

  // queryClient.end() not needed for mysql pool
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
