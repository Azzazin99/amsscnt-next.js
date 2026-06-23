import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { db } from "@/lib/db";
import { leavePersonSettings, people } from "@/lib/db/schema";
import { positionLabel } from "@/lib/person/position-labels";

export type DistrictPersonOption = {
  personId: string;
  label: string;
};

export type LeaveGrantPersonRow = {
  personId: string;
  displayName: string;
  positionLabel: string;
  commentPersonId: string | null;
  commentPerson2Id: string | null;
  grantPersonId: string | null;
  commentPersonName: string | null;
  commentPerson2Name: string | null;
  grantPersonName: string | null;
};

async function formatPersonIdName(personId: string | null): Promise<string | null> {
  if (!personId) return null;
  const [row] = await db
    .select({
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
    })
    .from(people)
    .where(eq(people.personId, personId))
    .limit(1);

  if (!row) return personId;
  return (
    formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      fallback: personId,
    }) || personId
  );
}

async function formatPersonIdNames(
  ids: Array<string | null>,
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();

  const rows = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
    })
    .from(people)
    .where(inArray(people.personId, unique));

  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(
      row.personId,
      formatPersonName({
        prefix: row.prefix,
        firstName: row.firstName,
        lastName: row.lastName,
        fallback: row.personId,
      }) || row.personId,
    );
  }
  for (const id of unique) {
    if (!map.has(id)) map.set(id, id);
  }
  return map;
}

export async function listDistrictPeopleForGrantPicker(
  positionCodes: number[],
): Promise<DistrictPersonOption[]> {
  const rows = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      positionCode: people.positionCode,
    })
    .from(people)
    .where(
      and(
        eq(people.organizationType, "district"),
        eq(people.status, 0),
        inArray(people.positionCode, positionCodes),
      ),
    )
    .orderBy(asc(people.firstName), asc(people.lastName));

  return rows.map((row) => ({
    personId: row.personId,
    label: `${formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      fallback: row.personId,
    })} (${positionLabel(row.positionCode)})`,
  }));
}

export async function listLeaveGrantPersonRows(): Promise<LeaveGrantPersonRow[]> {
  const districtPeople = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      positionCode: people.positionCode,
    })
    .from(people)
    .where(
      and(eq(people.organizationType, "district"), eq(people.status, 0)),
    )
    .orderBy(asc(people.firstName), asc(people.lastName));

  const settingsRows = await db.select().from(leavePersonSettings);
  const settingsByPerson = new Map(
    settingsRows.map((row) => [row.personId, row]),
  );

  const signerIds = settingsRows.flatMap((row) => [
    row.commentPersonId,
    row.commentPerson2Id,
    row.grantPersonId,
  ]);
  const nameMap = await formatPersonIdNames(signerIds);

  return districtPeople.map((person) => {
    const settings = settingsByPerson.get(person.personId);
    const commentPersonId = settings?.commentPersonId ?? null;
    const commentPerson2Id = settings?.commentPerson2Id ?? null;
    const grantPersonId = settings?.grantPersonId ?? null;

    return {
      personId: person.personId,
      displayName: formatPersonName({
        prefix: person.prefix,
        firstName: person.firstName,
        lastName: person.lastName,
        fallback: person.personId,
      }),
      positionLabel: positionLabel(person.positionCode),
      commentPersonId,
      commentPerson2Id,
      grantPersonId,
      commentPersonName: commentPersonId
        ? (nameMap.get(commentPersonId) ?? commentPersonId)
        : null,
      commentPerson2Name: commentPerson2Id
        ? (nameMap.get(commentPerson2Id) ?? commentPerson2Id)
        : null,
      grantPersonName: grantPersonId
        ? (nameMap.get(grantPersonId) ?? grantPersonId)
        : null,
    };
  });
}

export async function getLeaveGrantPersonEdit(personId: string) {
  const [person] = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      positionCode: people.positionCode,
    })
    .from(people)
    .where(
      and(
        eq(people.personId, personId),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .limit(1);

  if (!person) return null;

  const [settings] = await db
    .select()
    .from(leavePersonSettings)
    .where(eq(leavePersonSettings.personId, personId))
    .limit(1);

  return {
    personId: person.personId,
    displayName: formatPersonName({
      prefix: person.prefix,
      firstName: person.firstName,
      lastName: person.lastName,
      fallback: person.personId,
    }),
    positionLabel: positionLabel(person.positionCode),
    commentPersonId: settings?.commentPersonId ?? null,
    commentPerson2Id: settings?.commentPerson2Id ?? null,
    grantPersonId: settings?.grantPersonId ?? null,
    officerPersonId: settings?.officerPersonId ?? null,
  };
}

export async function upsertLeavePersonSettings(data: {
  personId: string;
  commentPersonId: string | null;
  commentPerson2Id: string | null;
  grantPersonId: string | null;
}) {
  await db
    .insert(leavePersonSettings)
    .values({
      personId: data.personId,
      commentPersonId: data.commentPersonId,
      commentPerson2Id: data.commentPerson2Id,
      grantPersonId: data.grantPersonId,
    })
    .onConflictDoUpdate({
      target: leavePersonSettings.personId,
      set: {
        commentPersonId: data.commentPersonId,
        commentPerson2Id: data.commentPerson2Id,
        grantPersonId: data.grantPersonId,
      },
    });
}

export { formatPersonIdName };
