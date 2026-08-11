import { eq, inArray } from "drizzle-orm";
import { db } from "../../src/lib/db";
import {
  leaveCancellations,
  leaveCollect,
  leaveQuotaBalances,
  leaveRequestFiles,
  leaveRequests,
  people,
  users,
} from "../../src/lib/db/schema";

/** ช่วง person_id สังเคราะห์สำหรับ demo (สพป.ชัยนาท office 1701) */
export const DEMO_PERSON_ID = "1701999990001";
export const DEMO_BUDGET_YEAR = 2569;

const DEMO_PERSON_IDS = [DEMO_PERSON_ID] as const;

export function assertDemoSeedAllowed(): void {
  if (process.env.AMSS_DEMO_SEED_OK === "1") return;

  const url = process.env.DATABASE_URL ?? "";
  const isLocal =
    /localhost|127\.0\.0\.1/i.test(url) ||
    url.includes("@postgres:") ||
    url.includes("@postgres/");

  if (!isLocal) {
    console.error(
      "ปฏิเสธ seed demo — DATABASE_URL ไม่ใช่ localhost\n" +
        "ตั้ง AMSS_DEMO_SEED_OK=1 เฉพาะเมื่อแน่ใจว่าเป็น DB dev",
    );
    process.exit(1);
  }
}

export async function deleteDemoLeaveData(
  personId: string = DEMO_PERSON_ID,
): Promise<void> {
  const requestRows = await db
    .select({ id: leaveRequests.id })
    .from(leaveRequests)
    .where(eq(leaveRequests.personId, personId));

  const requestIds = requestRows.map((r) => r.id);

  if (requestIds.length > 0) {
    await db
      .delete(leaveCancellations)
      .where(inArray(leaveCancellations.sourceRequestId, requestIds));
    await db
      .delete(leaveRequestFiles)
      .where(inArray(leaveRequestFiles.requestId, requestIds));
    await db
      .delete(leaveRequests)
      .where(inArray(leaveRequests.id, requestIds));
  }

  await db
    .delete(leaveQuotaBalances)
    .where(eq(leaveQuotaBalances.personId, personId));
  await db.delete(leaveCollect).where(eq(leaveCollect.personId, personId));
  await db.delete(users).where(eq(users.personId, personId));
  await db.delete(people).where(eq(people.personId, personId));
}

export function isDemoPersonId(personId: string): boolean {
  return DEMO_PERSON_IDS.includes(personId as (typeof DEMO_PERSON_IDS)[number]);
}
