import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { db } from "@/lib/db";
import { leaveCollect, people } from "@/lib/db/schema";
import { positionLabel } from "@/lib/person/position-labels";

export type LeaveCollectRow = {
  personId: string;
  displayName: string;
  positionLabel: string;
  collectDay: number;
  thisYearDay: number;
};

export async function listLeaveCollectRows(
  budgetYear: number,
): Promise<LeaveCollectRow[]> {
  const rows = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      positionCode: people.positionCode,
      collectDay: leaveCollect.collectDay,
      thisYearDay: leaveCollect.thisYearDay,
    })
    .from(people)
    .leftJoin(
      leaveCollect,
      and(
        eq(leaveCollect.personId, people.personId),
        eq(leaveCollect.budgetYear, budgetYear),
      ),
    )
    .where(
      and(eq(people.organizationType, "district"), eq(people.status, 0)),
    )
    .orderBy(asc(people.firstName), asc(people.lastName));

  return rows.map((person) => ({
    personId: person.personId,
    displayName: formatPersonName({
      prefix: person.prefix,
      firstName: person.firstName,
      lastName: person.lastName,
      fallback: person.personId,
    }),
    positionLabel: positionLabel(person.positionCode),
    collectDay: person.collectDay ?? 0,
    thisYearDay: person.thisYearDay ?? 0,
  }));
}

export async function getLeaveCollectForPerson(
  budgetYear: number,
  personId: string,
) {
  const [row] = await db
    .select()
    .from(leaveCollect)
    .where(
      and(
        eq(leaveCollect.budgetYear, budgetYear),
        eq(leaveCollect.personId, personId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function upsertLeaveCollectRow(data: {
  budgetYear: number;
  personId: string;
  collectDay: number;
  thisYearDay: number;
  officerPersonId: string;
}) {
  await db
    .insert(leaveCollect)
    .values({
      budgetYear: data.budgetYear,
      personId: data.personId,
      collectDay: data.collectDay,
      thisYearDay: data.thisYearDay,
      officerPersonId: data.officerPersonId,
    })
    .onDuplicateKeyUpdate({
      set: {
        collectDay: data.collectDay,
        thisYearDay: data.thisYearDay,
        officerPersonId: data.officerPersonId,
        updatedAt: new Date(),
      },
    });
}
