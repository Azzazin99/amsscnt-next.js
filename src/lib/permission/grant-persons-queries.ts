import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { db } from "@/lib/db";
import { permissionPersonSettings, people, schools } from "@/lib/db/schema";
import { positionLabel } from "@/lib/person/position-labels";

export type PersonOption = {
  personId: string;
  label: string;
};

export type PermissionGrantPersonRow = {
  personId: string;
  displayName: string;
  positionLabel: string;
  schoolName: string | null;
  groupPersonId: string | null;
  grantPersonId: string | null;
  groupPersonName: string | null;
  grantPersonName: string | null;
};

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

export async function listPeopleForPermissionGrantPicker(): Promise<
  PersonOption[]
> {
  const rows = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      positionCode: people.positionCode,
    })
    .from(people)
    .where(eq(people.status, 0))
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

export async function listPermissionGrantPersonRows(): Promise<
  PermissionGrantPersonRow[]
> {
  const staff = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      positionCode: people.positionCode,
      schoolName: schools.name,
    })
    .from(people)
    .leftJoin(schools, eq(schools.id, people.schoolId))
    .where(eq(people.status, 0))
    .orderBy(asc(people.firstName), asc(people.lastName));

  const settingsRows = await db.select().from(permissionPersonSettings);
  const settingsByPerson = new Map(
    settingsRows.map((row) => [row.personId, row]),
  );

  const signerIds = settingsRows.flatMap((row) => [
    row.groupPersonId,
    row.grantPersonId,
  ]);
  const nameMap = await formatPersonIdNames(signerIds);

  return staff.map((person) => {
    const settings = settingsByPerson.get(person.personId);
    const groupPersonId = settings?.groupPersonId ?? null;
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
      schoolName: person.schoolName,
      groupPersonId,
      grantPersonId,
      groupPersonName: groupPersonId
        ? (nameMap.get(groupPersonId) ?? groupPersonId)
        : null,
      grantPersonName: grantPersonId
        ? (nameMap.get(grantPersonId) ?? grantPersonId)
        : null,
    };
  });
}

export async function getPermissionGrantPersonEdit(personId: string) {
  const [person] = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      positionCode: people.positionCode,
      schoolName: schools.name,
    })
    .from(people)
    .leftJoin(schools, eq(schools.id, people.schoolId))
    .where(and(eq(people.personId, personId), eq(people.status, 0)))
    .limit(1);

  if (!person) return null;

  const [settings] = await db
    .select()
    .from(permissionPersonSettings)
    .where(eq(permissionPersonSettings.personId, personId))
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
    schoolName: person.schoolName,
    groupPersonId: settings?.groupPersonId ?? null,
    grantPersonId: settings?.grantPersonId ?? null,
  };
}

export async function upsertPermissionPersonSettings(data: {
  personId: string;
  groupPersonId: string | null;
  grantPersonId: string | null;
}) {
  await db
    .insert(permissionPersonSettings)
    .values({
      personId: data.personId,
      groupPersonId: data.groupPersonId,
      grantPersonId: data.grantPersonId,
    })
    .onDuplicateKeyUpdate({
      set: {
        groupPersonId: data.groupPersonId,
        grantPersonId: data.grantPersonId,
      },
    });
}

export async function getPermissionPersonSettings(personId: string) {
  const [row] = await db
    .select()
    .from(permissionPersonSettings)
    .where(eq(permissionPersonSettings.personId, personId))
    .limit(1);
  return row ?? null;
}
