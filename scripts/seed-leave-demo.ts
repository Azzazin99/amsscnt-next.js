/**
 * Seed เจ้าหน้าที่ demo + ข้อมูลการลาขั้นต่ำ (dev only)
 *
 * Usage:
 *   npm run db:seed-leave-demo
 *   npm run db:seed-leave-demo -- --reset
 *
 * Login: username = DEMO_PERSON_ID, password = AMSS_IMPORT_PASSWORD (default Imported123)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq, ne } from "drizzle-orm";
import { db } from "../src/lib/db";
import {
  leaveCollect,
  leaveQuotaBalances,
  leaveRequests,
  leaveYears,
  people,
  users,
  workgroups,
} from "../src/lib/db/schema";
import {
  assertDemoSeedAllowed,
  deleteDemoLeaveData,
  DEMO_BUDGET_YEAR,
  DEMO_PERSON_ID,
} from "./seed/demo-ids";

const DEMO_FIRST_NAME = "ทดสอบ";
const DEMO_LAST_NAME = "ระบบลา";
const DEMO_SERVICE_START = "2010-04-01";

type ApprovedLeaveSeed = {
  leaveType: number;
  leaveStart: string;
  leaveFinish: string;
  leaveTotal: number;
  because: string;
  stats: {
    sickAgo?: number;
    sickThis?: number;
    sickTotal?: number;
    privacyAgo?: number;
    privacyThis?: number;
    privacyTotal?: number;
    relaxAgo?: number;
    relaxThis?: number;
    relaxTotal?: number;
    relaxCollect?: number;
    relaxThisYear?: number;
  };
};

const APPROVED_LEAVES: ApprovedLeaveSeed[] = [
  {
    leaveType: 1,
    leaveStart: "2026-01-10",
    leaveFinish: "2026-01-11",
    leaveTotal: 2,
    because: "ทดสอบลาป่วย (demo)",
    stats: { sickAgo: 0, sickThis: 2, sickTotal: 2 },
  },
  {
    leaveType: 2,
    leaveStart: "2026-02-05",
    leaveFinish: "2026-02-05",
    leaveTotal: 1,
    because: "ทดสอบลากิจ (demo)",
    stats: { privacyAgo: 0, privacyThis: 1, privacyTotal: 1 },
  },
  {
    leaveType: 4,
    leaveStart: "2026-03-10",
    leaveFinish: "2026-03-10",
    leaveTotal: 1,
    because: "ทดสอบลาพักผ่อน (demo)",
    stats: {
      relaxAgo: 0,
      relaxThis: 1,
      relaxTotal: 1,
      relaxCollect: 10,
      relaxThisYear: 5,
    },
  },
];

async function deactivateOtherLeaveYears(budgetYear: number) {
  await db
    .update(leaveYears)
    .set({ yearActive: false })
    .where(ne(leaveYears.budgetYear, budgetYear));
}

async function upsertActiveLeaveYear(budgetYear: number) {
  await deactivateOtherLeaveYears(budgetYear);
  await db
    .insert(leaveYears)
    .values({ budgetYear, yearActive: true })
    .onDuplicateKeyUpdate({
      set: { yearActive: true },
    });
}

async function resolveWorkgroupId(): Promise<number> {
  const [row] = await db
    .select({ id: workgroups.id })
    .from(workgroups)
    .where(eq(workgroups.active, true))
    .limit(1);

  if (!row) {
    throw new Error(
      "ไม่พบ workgroups — รัน npm run db:import-smart-area หรือ sync workgroups ก่อน",
    );
  }
  return row.id;
}

async function upsertDemoPerson(workgroupId: number) {
  await db
    .insert(people)
    .values({
      personId: DEMO_PERSON_ID,
      prefix: "นาย",
      firstName: DEMO_FIRST_NAME,
      lastName: DEMO_LAST_NAME,
      workgroupId,
      organizationType: "district",
      positionCode: 14,
      status: 0,
      serviceStartDate: DEMO_SERVICE_START,
      sex: "1",
    })
    .onDuplicateKeyUpdate({
      set: {
        prefix: "นาย",
        firstName: DEMO_FIRST_NAME,
        lastName: DEMO_LAST_NAME,
        workgroupId,
        organizationType: "district",
        positionCode: 14,
        status: 0,
        serviceStartDate: DEMO_SERVICE_START,
        sex: "1",
      },
    });
}

async function upsertDemoUser(passwordHash: string) {
  const displayName = `${DEMO_FIRST_NAME} ${DEMO_LAST_NAME}`;
  await db
    .insert(users)
    .values({
      username: DEMO_PERSON_ID,
      personId: DEMO_PERSON_ID,
      email: `${DEMO_PERSON_ID}@demo.local`,
      passwordHash,
      name: displayName,
      organizationType: "district",
      schoolId: null,
      isSuperAdmin: false,
      isAdmin: false,
      status: 1,
    })
    .onDuplicateKeyUpdate({
      set: {
        username: DEMO_PERSON_ID,
        email: `${DEMO_PERSON_ID}@demo.local`,
        passwordHash,
        name: displayName,
        organizationType: "district",
        schoolId: null,
        status: 1,
      },
    });
}

async function upsertLeaveCollect() {
  await db
    .insert(leaveCollect)
    .values({
      budgetYear: DEMO_BUDGET_YEAR,
      personId: DEMO_PERSON_ID,
      collectDay: 10,
      thisYearDay: 5,
      officerPersonId: DEMO_PERSON_ID,
    })
    .onDuplicateKeyUpdate({
      set: {
        collectDay: 10,
        thisYearDay: 5,
        officerPersonId: DEMO_PERSON_ID,
      },
    });
}

async function upsertQuotaBalances() {
  const rows = [
    { leaveType: 2, entitled: 45, used: 1, carried: 0 },
    { leaveType: 4, entitled: 10, used: 1, carried: 0 },
  ];

  for (const row of rows) {
    await db
      .insert(leaveQuotaBalances)
      .values({
        personId: DEMO_PERSON_ID,
        budgetYear: DEMO_BUDGET_YEAR,
        leaveType: row.leaveType,
        entitled: row.entitled,
        used: row.used,
        carried: row.carried,
      })
      .onDuplicateKeyUpdate({
      set: {
          entitled: row.entitled,
          used: row.used,
          carried: row.carried,
        },
      });
  }
}

async function seedApprovedRequests() {
  await db
    .delete(leaveRequests)
    .where(eq(leaveRequests.personId, DEMO_PERSON_ID));

  const grantDate = new Date("2026-03-15T10:00:00+07:00");

  for (const item of APPROVED_LEAVES) {
    await db.insert(leaveRequests).values({
      personId: DEMO_PERSON_ID,
      schoolId: null,
      leaveType: item.leaveType,
      writeAt: "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาชัยนาท",
      because: item.because,
      leaveStart: item.leaveStart,
      leaveFinish: item.leaveFinish,
      leaveTotal: item.leaveTotal,
      sickAgo: item.stats.sickAgo ?? 0,
      sickThis: item.stats.sickThis ?? 0,
      sickTotal: item.stats.sickTotal ?? 0,
      privacyAgo: item.stats.privacyAgo ?? 0,
      privacyThis: item.stats.privacyThis ?? 0,
      privacyTotal: item.stats.privacyTotal ?? 0,
      birthAgo: 0,
      birthThis: 0,
      birthTotal: 0,
      relaxAgo: item.stats.relaxAgo ?? 0,
      relaxThis: item.stats.relaxThis ?? 0,
      relaxTotal: item.stats.relaxTotal ?? 0,
      relaxCollect: item.stats.relaxCollect ?? 0,
      relaxThisYear: item.stats.relaxThisYear ?? 0,
      contact: "demo",
      contactTel: "0812345678",
      noComment: false,
      jobPersonSigned: false,
      commanderGrant: 1,
      commanderComment: "อนุมัติ (demo)",
      grantDate,
      createdAt: grantDate,
    });
  }
}

async function main() {
  const reset = process.argv.includes("--reset");
  assertDemoSeedAllowed();

  if (reset) {
    console.log("ลบข้อมูล demo_staff ...");
    await deleteDemoLeaveData(DEMO_PERSON_ID);
    console.log("ลบเสร็จ");
    return;
  }

  const password = await bcrypt.hash(
    process.env.AMSS_IMPORT_PASSWORD ?? "Imported123",
    10,
  );

  const workgroupId = await resolveWorkgroupId();
  await upsertActiveLeaveYear(DEMO_BUDGET_YEAR);
  await upsertDemoPerson(workgroupId);
  await upsertDemoUser(password);
  await upsertLeaveCollect();
  await upsertQuotaBalances();
  await seedApprovedRequests();

  console.log("seed leave demo complete");
  console.log(`  person_id / username: ${DEMO_PERSON_ID}`);
  console.log(
    `  password: ${process.env.AMSS_IMPORT_PASSWORD ? "(AMSS_IMPORT_PASSWORD)" : "Imported123"}`,
  );
  console.log(`  budget_year: ${DEMO_BUDGET_YEAR} (active)`);
  console.log(`  leave_requests: ${APPROVED_LEAVES.length} (commander_grant=1)`);
  console.log("  ทด: /modules/leave/requests · /modules/leave/reports/today");
  console.log("  ลบ: npm run db:seed-leave-demo -- --reset");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
