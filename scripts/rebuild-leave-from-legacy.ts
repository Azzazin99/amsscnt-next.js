/**
 * Rebuild leave_* from legacy la_* staging (truncate + ETL import).
 *
 * Does NOT rename la_* tables — maps columns into leave_* via import-leave.ts.
 *
 * Prerequisites:
 *   npm run db:load-legacy
 *   Align personnel with la_* person_id (recommended before first run):
 *     npm run db:import-smart-area -- --scope=full --legacy-master
 *
 * Usage:
 *   npm run db:rebuild-leave-from-legacy
 *   npm run db:rebuild-leave-from-legacy -- --no-backfill-leave-people
 */
import "dotenv/config";
import { importLeave } from "./import/import-leave";
import {
  buildLeaveImportMapsFromDb,
  countLegacyLeaveRows,
  countLeaveAppRows,
  truncateLeaveTables,
} from "./import/leave-import-cli";
import { legacyTableExists } from "./import/shared";
import { queryClient } from "../src/lib/db";

async function assertPrerequisites() {
  const hasLaYear = await legacyTableExists("la_year");
  const hasPersonMain = await legacyTableExists("person_main");

  if (!hasLaYear) {
    console.error(
      "ไม่พบตาราง la_* — รัน npm run db:load-legacy ก่อน",
    );
    process.exit(1);
  }

  if (!hasPersonMain) {
    console.error(
      "ไม่พบ person_main — รัน npm run db:load-legacy ก่อน",
    );
    process.exit(1);
  }

  const appCounts = await countLeaveAppRows();
  if (appCounts.people === 0) {
    console.warn(
      "คำเตือน: ตาราง people ว่าง — import จะ skip ทุกแถว (no person).\n" +
        "  แนะนำ: npm run db:import-smart-area -- --scope=core --legacy-master\n" +
        "  หรือ: npm run db:import-smart-area -- --scope=full --legacy-master",
    );
  }
}

async function main() {
  const skipPeopleBackfill = process.argv.includes("--no-backfill-leave-people");

  console.log("rebuild leave_* from legacy la_* (ETL, not table rename)...");

  await assertPrerequisites();

  const legacyBefore = await countLegacyLeaveRows();
  const appBefore = await countLeaveAppRows();

  console.log("\n--- legacy staging (la_*) ---");
  console.log("la_main:", legacyBefore.laMain);
  console.log("la_main_bk:", legacyBefore.laMainBk);
  console.log(
    "la_cancel*:",
    legacyBefore.laCancel +
      legacyBefore.laCancelBk +
      legacyBefore.laCancelBk01,
  );
  console.log("people (app):", appBefore.people);
  console.log("leave_requests (before):", appBefore.leaveRequests);

  console.log("\ntruncate leave_* tables...");
  await truncateLeaveTables();

  const maps = await buildLeaveImportMapsFromDb();
  console.log("import from la_* ...");
  const result = await importLeave(maps, { skipPeopleBackfill });

  const legacyAfter = await countLegacyLeaveRows();
  const appAfter = await countLeaveAppRows();

  console.log("\n--- import result ---");
  console.log("people backfilled:", result.peopleBackfilled);
  console.log(
    "people backfill skipped (existing):",
    result.peopleBackfillSkippedExisting,
  );
  console.log("people names refreshed:", result.peopleNamesRefreshed);
  console.log("leave_years:", result.years);
  console.log("leave_permissions:", result.permissions);
  console.log("leave_person_settings:", result.personSettings);
  console.log("leave_collect:", result.collect);
  console.log("leave_requests inserted:", result.requestsInserted);
  console.log(
    "leave_requests skipped (existing):",
    result.requestsSkippedExisting,
  );
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

  const legacyRequestTotal =
    legacyAfter.laMain + legacyAfter.laMainBk;
  const legacyCancelTotal =
    legacyAfter.laCancel +
    legacyAfter.laCancelBk +
    legacyAfter.laCancelBk01;

  console.log("\n--- comparison ---");
  console.log(
    `la_main + la_main_bk: ${legacyRequestTotal} → leave_requests: ${appAfter.leaveRequests}`,
  );
  console.log(
    `leave_requests (commander_grant=1): ${appAfter.leaveRequestsApproved}`,
  );
  console.log(
    `la_cancel* (staging): ${legacyCancelTotal} → leave_cancellations: ${appAfter.leaveCancellations}`,
  );

  if (result.requestsSkippedNoPerson > 0) {
    console.warn(
      `\nคำเตือน: ${result.requestsSkippedNoPerson} แถว skip เพราะ person_id ไม่อยู่ใน people` +
        (skipPeopleBackfill ? " (--no-backfill-leave-people)" : ""),
    );
  }

  if (
    legacyRequestTotal > 0 &&
    appAfter.leaveRequests === 0 &&
    result.requestsSkippedNoPerson === legacyRequestTotal
  ) {
    console.error(
      "\nไม่มี leave_requests ถูก import — ตรวจสอบว่า people align กับ la_* แล้ว",
    );
    process.exit(1);
  }

  console.log("\nRebuild leave from legacy complete.");
  // queryClient.end() not needed for mysql pool
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
