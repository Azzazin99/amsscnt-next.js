import { and, asc, count, desc, eq, like, inArray } from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { db } from "@/lib/db";
import {
  cabinetDocuments,
  cabinetPermissions,
  people,
  users,
} from "@/lib/db/schema";

export const CABINET_PAGE_SIZE = 20;

export type CabinetListRow = {
  id: number;
  docSubject: string;
  docType: string;
  docSize: number;
  personLabel: string;
  recDate: Date;
};

export function parseCabinetListParams(params: { page?: string; q?: string }) {
  const page = Math.max(1, Number(params.page) || 1);
  const q = (params.q ?? "").trim();
  return { page, q };
}

export async function resolveCabinetListPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / CABINET_PAGE_SIZE));
  return Math.min(page, totalPages);
}

function searchCondition(q: string) {
  if (q.length < 2) return undefined;
  return like(cabinetDocuments.docSubject, `%${q}%`);
}

export async function countCabinetDocuments(q: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(cabinetDocuments)
    .where(searchCondition(q));

  return Number(row?.total ?? 0);
}

export async function listCabinetDocumentsPage(input: {
  page: number;
  q: string;
}): Promise<CabinetListRow[]> {
  const offset = (input.page - 1) * CABINET_PAGE_SIZE;

  const rows = await db
    .select({
      id: cabinetDocuments.id,
      docSubject: cabinetDocuments.docSubject,
      docType: cabinetDocuments.docType,
      docSize: cabinetDocuments.docSize,
      personId: cabinetDocuments.personId,
      recDate: cabinetDocuments.recDate,
    })
    .from(cabinetDocuments)
    .where(searchCondition(input.q))
    .orderBy(desc(cabinetDocuments.recDate))
    .limit(CABINET_PAGE_SIZE)
    .offset(offset);

  const labels = await resolvePersonLabels(rows.map((r) => r.personId));

  return rows.map((row) => ({
    id: row.id,
    docSubject: row.docSubject,
    docType: row.docType,
    docSize: row.docSize,
    personLabel: labels.get(row.personId) ?? row.personId,
    recDate: row.recDate,
  }));
}

export async function getCabinetDocument(id: number) {
  const [row] = await db
    .select()
    .from(cabinetDocuments)
    .where(eq(cabinetDocuments.id, id))
    .limit(1);

  return row ?? null;
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

export type CabinetPermissionRow = {
  id: number;
  userId: number;
  personId: string;
  p1: number;
  officerPersonId: string | null;
  displayName: string;
};

export async function listCabinetPermissions(): Promise<CabinetPermissionRow[]> {
  const rows = await db
    .select({
      id: cabinetPermissions.id,
      userId: cabinetPermissions.userId,
      personId: users.personId,
      p1: cabinetPermissions.p1,
      officerPersonId: cabinetPermissions.officerPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(cabinetPermissions)
    .innerJoin(users, eq(cabinetPermissions.userId, users.id))
    .leftJoin(
      people,
      and(eq(people.personId, users.personId), eq(people.status, 0)),
    )
    .orderBy(asc(cabinetPermissions.id));

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

export async function getCabinetModulePermission(id: number) {
  const rows = await listCabinetPermissions();
  return rows.find((r) => r.id === id) ?? null;
}

export async function getCabinetPermissionByUserId(userId: number) {
  const [row] = await db
    .select({ id: cabinetPermissions.id })
    .from(cabinetPermissions)
    .where(eq(cabinetPermissions.userId, userId))
    .limit(1);
  return row ?? null;
}

export type StaffOption = {
  userId: number;
  personId: string;
  label: string;
};

export async function listStaffForCabinetPermissionPicker(
  excludeUserId?: number,
): Promise<StaffOption[]> {
  const existing = await db
    .select({ userId: cabinetPermissions.userId })
    .from(cabinetPermissions);

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
