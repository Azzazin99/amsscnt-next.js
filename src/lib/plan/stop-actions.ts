"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { planActivities } from "@/lib/db/schema";
import { requirePlanOperateAccess } from "@/lib/plan/scope";

export async function updateStoppedActivities(
  budgetYear: number,
  stoppedIds: number[],
) {
  await requirePlanOperateAccess();

  const all = await db
    .select({ id: planActivities.id })
    .from(planActivities)
    .where(eq(planActivities.budgetYear, budgetYear));

  const stopSet = new Set(stoppedIds);
  for (const row of all) {
    await db
      .update(planActivities)
      .set({ stop: stopSet.has(row.id) ? 1 : 0 })
      .where(eq(planActivities.id, row.id));
  }

  revalidatePath("/modules/plan/surplus/activities/stop");
  return { ok: true as const };
}

export async function bulkStopActivities(ids: number[]) {
  if (ids.length === 0) return { ok: true as const };
  await requirePlanOperateAccess();
  await db
    .update(planActivities)
    .set({ stop: 1 })
    .where(inArray(planActivities.id, ids));
  revalidatePath("/modules/plan/surplus/activities/stop");
  return { ok: true as const };
}
