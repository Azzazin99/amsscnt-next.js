import { and, asc, count, desc, eq, like, inArray, or } from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { db } from "@/lib/db";
import {
  affairEntries,
  affairPermissions,
  people,
  users,
} from "@/lib/db/schema";

export const AFFAIR_PAGE_SIZE = 20;

export type AffairListRow = {
  id: number;
  affairDate: string;
  affairTime: string;
  subject: string;
  location: string;
  operationPersonLabel: string;
  remark: string | null;
};

export function parseAffairListParams(params: { page?: string; q?: string }) {
  const page = Math.max(1, Number(params.page) || 1);
  const q = (params.q ?? "").trim();
  return { page, q };
}

export async function resolveAffairListPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / AFFAIR_PAGE_SIZE));
  return Math.min(page, totalPages);
}

function searchCondition(q: string) {
  if (q.length < 2) return undefined;
  const pattern = `%${q}%`;
  return or(
    like(affairEntries.subject, pattern),
    like(affairEntries.location, pattern),
    like(affairEntries.remark, pattern),
  );
}

export async function countAffairEntries(q: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(affairEntries)
    .where(searchCondition(q));

  return Number(row?.total ?? 0);
}

export async function listAffairEntriesPage(input: {
  page: number;
  q: string;
}): Promise<AffairListRow[]> {
  const offset = (input.page - 1) * AFFAIR_PAGE_SIZE;

  const rows = await db
    .select({
      id: affairEntries.id,
      affairDate: affairEntries.affairDate,
      affairTime: affairEntries.affairTime,
      subject: affairEntries.subject,
      location: affairEntries.location,
      operationPersonId: affairEntries.operationPersonId,
      remark: affairEntries.remark,
    })
    .from(affairEntries)
    .where(searchCondition(input.q))
    .orderBy(desc(affairEntries.affairDate), desc(affairEntries.id))
    .limit(AFFAIR_PAGE_SIZE)
    .offset(offset);

  const labels = await resolvePersonLabels(
    rows.map((r) => r.operationPersonId),
  );

  return rows.map((row) => ({
    id: row.id,
    affairDate: row.affairDate,
    affairTime: row.affairTime,
    subject: row.subject,
    location: row.location,
    operationPersonLabel:
      labels.get(row.operationPersonId) ?? row.operationPersonId,
    remark: row.remark,
  }));
}

export async function getAffairEntry(id: number) {
  const [row] = await db
    .select()
    .from(affairEntries)
    .where(eq(affairEntries.id, id))
    .limit(1);

  return row ?? null;
}

export type PersonOption = {
  personId: string;
  label: string;
};

export async function listActivePeopleForAffairPicker(): Promise<PersonOption[]> {
  const rows = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
    })
    .from(people)
    .where(eq(people.status, 0))
    .orderBy(asc(people.firstName), asc(people.lastName));

  return rows.map((row) => ({
    personId: row.personId,
    label:
      formatPersonName({
        prefix: row.prefix,
        firstName: row.firstName,
        lastName: row.lastName,
        fallback: row.personId,
      }) || row.personId,
  }));
}

async function resolvePersonLabels(
  personIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(personIds.filter(Boolean))];
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
  return map;
}

export type AffairPermissionRow = {
  id: number;
  userId: number;
  personId: string;
  p1: number;
  officerPersonId: string | null;
  displayName: string;
};

export async function listAffairPermissions(): Promise<AffairPermissionRow[]> {
  const rows = await db
    .select({
      id: affairPermissions.id,
      userId: affairPermissions.userId,
      personId: users.personId,
      p1: affairPermissions.p1,
      officerPersonId: affairPermissions.officerPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(affairPermissions)
    .innerJoin(users, eq(affairPermissions.userId, users.id))
    .leftJoin(
      people,
      and(eq(people.personId, users.personId), eq(people.status, 0)),
    )
    .orderBy(asc(affairPermissions.id));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    personId: row.personId,
    p1: row.p1,
    officerPersonId: row.officerPersonId,
    displayName:
      formatPersonName({
        prefix: row.prefix,
        firstName: row.firstName,
        lastName: row.lastName,
        fallback: row.userName,
      }) || row.userName,
  }));
}

export async function getAffairModulePermission(id: number) {
  const rows = await listAffairPermissions();
  return rows.find((r) => r.id === id) ?? null;
}

export async function getAffairPermissionByUserId(userId: number) {
  const [row] = await db
    .select({ id: affairPermissions.id })
    .from(affairPermissions)
    .where(eq(affairPermissions.userId, userId))
    .limit(1);
  return row ?? null;
}

export type StaffOption = {
  userId: number;
  personId: string;
  label: string;
};

export async function listStaffForAffairPermissionPicker(
  excludeUserId?: number,
): Promise<StaffOption[]> {
  const existing = await db
    .select({ userId: affairPermissions.userId })
    .from(affairPermissions);

  const taken = new Set(existing.map((r) => r.userId));

  const rows = await db
    .select({
      userId: users.id,
      personId: users.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(users)
    .leftJoin(
      people,
      and(eq(people.personId, users.personId), eq(people.status, 0)),
    )
    .where(eq(users.status, 1))
    .orderBy(asc(people.firstName), asc(people.lastName));

  return rows
    .filter((row) => row.userId !== excludeUserId && !taken.has(row.userId))
    .map((row) => ({
      userId: row.userId,
      personId: row.personId,
      label:
        formatPersonName({
          prefix: row.prefix,
          firstName: row.firstName,
          lastName: row.lastName,
          fallback: row.userName,
        }) || row.userName,
    }));
}

export async function getLatestAffairSubject(): Promise<string | null> {
  const [row] = await db
    .select({ subject: affairEntries.subject })
    .from(affairEntries)
    .orderBy(desc(affairEntries.id))
    .limit(1);
  return row?.subject ?? null;
}

export async function getLatestAffairLocation(): Promise<string | null> {
  const [row] = await db
    .select({ location: affairEntries.location })
    .from(affairEntries)
    .orderBy(desc(affairEntries.id))
    .limit(1);
  return row?.location ?? null;
}
