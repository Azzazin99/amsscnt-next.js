import { eq } from "drizzle-orm";
import { db, queryClient } from "../../src/lib/db";
import { people } from "../../src/lib/db/schema";
import { sexFromPrefix } from "../../src/lib/person/constants";
import {
  cleanText,
  legacyPersonId,
  legacyTableExists,
  normalizeLegacyDate,
  type ImportMaps,
} from "./shared";

const LEAVE_PERSON_TABLES = [
  "la_main",
  "la_main_bk",
  "la_cancel",
  "la_cancel_bk",
  "la_cancel_bk01",
] as const;

const STUB_FIRST_NAME = "ประวัติลา";

type PersonInsert = typeof people.$inferInsert;

export type LegacyPersonIdentity = {
  row: PersonInsert;
  isStub: boolean;
};

export function isLegacyLeaveStubPerson(row: {
  personId: string;
  firstName: string;
  lastName: string;
}): boolean {
  return row.firstName === STUB_FIRST_NAME && row.lastName === row.personId;
}

async function collectLeavePersonIds(): Promise<Set<string>> {
  const ids = new Set<string>();

  for (const table of LEAVE_PERSON_TABLES) {
    if (!(await legacyTableExists(table))) continue;
    const rows = await queryClient.unsafe(
      `SELECT DISTINCT person_id FROM "${table}"`,
    );
    for (const row of rows) {
      const id = legacyPersonId((row as { person_id: unknown }).person_id);
      if (id) ids.add(id);
    }
  }

  return ids;
}

function legacySex(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (raw === "1" || raw === "2") return raw;
  return null;
}

async function loadPersonDetail(
  personId: string,
): Promise<{ sex: string | null; serviceStartDate: string | null }> {
  if (!(await legacyTableExists("person_detail"))) {
    return { sex: null, serviceStartDate: null };
  }

  const rows = await queryClient<
    Record<string, unknown>[]
  >`SELECT sex, start_day FROM person_detail WHERE person_id = ${personId} LIMIT 1`;
  const row = rows[0];
  if (!row) return { sex: null, serviceStartDate: null };

  return {
    sex: legacySex(row.sex),
    serviceStartDate: normalizeLegacyDate(row.start_day),
  };
}

function stubPersonRow(
  personId: string,
  detail: { sex: string | null; serviceStartDate: string | null },
): PersonInsert {
  return {
    personId,
    prefix: null,
    firstName: STUB_FIRST_NAME,
    lastName: personId,
    organizationType: "district",
    positionCode: 0,
    status: 0,
    multiSchool: false,
    serviceStartDate: detail.serviceStartDate,
    sex: detail.sex,
  };
}

export async function resolveLegacyPersonIdentity(
  personId: string,
  maps: ImportMaps,
): Promise<LegacyPersonIdentity> {
  const detail = await loadPersonDetail(personId);

  if (await legacyTableExists("person_main")) {
    const rows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM person_main WHERE person_id = ${personId} LIMIT 1`;
    const row = rows[0];
    if (row) {
      const prefix = cleanText(row.prename) || null;
      const firstName = cleanText(row.name);
      const lastName = cleanText(row.surname);
      if (firstName && lastName) {
        const dept = Number(row.department ?? 0);
        return {
          isStub: false,
          row: {
            personId,
            prefix,
            firstName,
            lastName,
            workgroupId: maps.workgroupMap.get(dept) ?? null,
            organizationType: "district",
            positionCode: Number(row.position_code ?? 0),
            status: Number(row.status ?? 0),
            multiSchool: false,
            serviceStartDate: detail.serviceStartDate,
            sex: sexFromPrefix(prefix) ?? detail.sex,
          },
        };
      }
    }
  }

  if (await legacyTableExists("person_sch_main")) {
    const rows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM person_sch_main WHERE person_id = ${personId} LIMIT 1`;
    const row = rows[0];
    if (row) {
      const prefix = cleanText(row.prename) || null;
      const firstName = cleanText(row.name);
      const lastName = cleanText(row.surname);
      if (firstName && lastName) {
        const schoolCode = String(row.school_code ?? "");
        return {
          isStub: false,
          row: {
            personId,
            prefix,
            firstName,
            lastName,
            schoolId: maps.schoolMap.get(schoolCode) ?? null,
            organizationType: "school",
            positionCode: Number(row.position_code ?? 0),
            status: Number(row.status ?? 0),
            multiSchool: Number(row.other ?? 0) === 1,
            serviceStartDate: detail.serviceStartDate,
            sex: sexFromPrefix(prefix) ?? detail.sex,
          },
        };
      }
    }
  }

  return {
    isStub: true,
    row: stubPersonRow(personId, detail),
  };
}

function personUpdateFields(identity: LegacyPersonIdentity): Partial<PersonInsert> {
  const { row } = identity;
  return {
    prefix: row.prefix,
    firstName: row.firstName,
    lastName: row.lastName,
    workgroupId: row.workgroupId ?? null,
    schoolId: row.schoolId ?? null,
    organizationType: row.organizationType,
    positionCode: row.positionCode,
    status: row.status,
    multiSchool: row.multiSchool,
    serviceStartDate: row.serviceStartDate,
    sex: row.sex,
  };
}

export async function ensureLeavePeopleFromLegacy(
  maps: ImportMaps,
): Promise<{
  inserted: number;
  skippedExisting: number;
  namesRefreshed: number;
}> {
  const leavePersonIds = await collectLeavePersonIds();
  if (leavePersonIds.size === 0) {
    return { inserted: 0, skippedExisting: 0, namesRefreshed: 0 };
  }

  const existingRows = await db
    .select({
      personId: people.personId,
      firstName: people.firstName,
      lastName: people.lastName,
    })
    .from(people);
  const existingById = new Map(
    existingRows.map((r) => [r.personId, r] as const),
  );

  let inserted = 0;
  let skippedExisting = 0;
  let namesRefreshed = 0;

  for (const personId of leavePersonIds) {
    const identity = await resolveLegacyPersonIdentity(personId, maps);
    const current = existingById.get(personId);

    if (current) {
      if (
        !identity.isStub &&
        isLegacyLeaveStubPerson({
          personId: current.personId,
          firstName: current.firstName,
          lastName: current.lastName,
        })
      ) {
        await db
          .update(people)
          .set(personUpdateFields(identity))
          .where(eq(people.personId, personId));
        namesRefreshed += 1;
      } else {
        skippedExisting += 1;
      }
      continue;
    }

    const result = await db
      .insert(people)
      .values(identity.row)
      .onConflictDoNothing()
      .returning({ personId: people.personId });

    if (result.length > 0) {
      inserted += 1;
      existingById.set(personId, {
        personId,
        firstName: identity.row.firstName,
        lastName: identity.row.lastName,
      });
    } else {
      skippedExisting += 1;
    }
  }

  return { inserted, skippedExisting, namesRefreshed };
}
