import { and, asc, count, desc, eq, like, inArray, ne } from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { db } from "@/lib/db";
import {
  newsArticles,
  newsMainitems,
  newsPermissions,
  newsSections,
  people,
  users,
} from "@/lib/db/schema";

export const NEWS_PAGE_SIZE = 20;

export async function getActiveNewsMainitem() {
  const [row] = await db
    .select()
    .from(newsMainitems)
    .where(eq(newsMainitems.itemActive, true))
    .orderBy(desc(newsMainitems.code))
    .limit(1);

  return row ?? null;
}

export async function listNewsMainitems() {
  return db
    .select()
    .from(newsMainitems)
    .orderBy(desc(newsMainitems.code));
}

export async function getNewsMainitem(id: number) {
  const [row] = await db
    .select()
    .from(newsMainitems)
    .where(eq(newsMainitems.id, id))
    .limit(1);
  return row ?? null;
}

export async function getNewsMainitemByCode(code: number) {
  const [row] = await db
    .select({ id: newsMainitems.id })
    .from(newsMainitems)
    .where(eq(newsMainitems.code, code))
    .limit(1);
  return row ?? null;
}

export type NewsSectionRow = {
  id: number;
  code: number;
  name: string;
};

export async function listNewsSectionsForMainitem(
  mainitemCode: number,
): Promise<NewsSectionRow[]> {
  return db
    .select({
      id: newsSections.id,
      code: newsSections.code,
      name: newsSections.name,
    })
    .from(newsSections)
    .where(eq(newsSections.mainitemCode, mainitemCode))
    .orderBy(asc(newsSections.code));
}

export async function countNewsSections(mainitemCode: number): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(newsSections)
    .where(eq(newsSections.mainitemCode, mainitemCode));
  return Number(row?.total ?? 0);
}

export async function listNewsSectionsPage(input: {
  mainitemCode: number;
  page: number;
}): Promise<NewsSectionRow[]> {
  const offset = (input.page - 1) * NEWS_PAGE_SIZE;
  return db
    .select({
      id: newsSections.id,
      code: newsSections.code,
      name: newsSections.name,
    })
    .from(newsSections)
    .where(eq(newsSections.mainitemCode, input.mainitemCode))
    .orderBy(asc(newsSections.code))
    .limit(NEWS_PAGE_SIZE)
    .offset(offset);
}

export async function getNewsSection(id: number) {
  const [row] = await db
    .select()
    .from(newsSections)
    .where(eq(newsSections.id, id))
    .limit(1);
  return row ?? null;
}

export async function findDuplicateSectionCode(
  mainitemCode: number,
  code: number,
  exceptId?: number,
) {
  const conditions = [
    eq(newsSections.mainitemCode, mainitemCode),
    eq(newsSections.code, code),
  ];
  if (exceptId) {
    conditions.push(ne(newsSections.id, exceptId));
  }

  const [row] = await db
    .select({ id: newsSections.id })
    .from(newsSections)
    .where(and(...conditions))
    .limit(1);

  return row ?? null;
}

export type NewsArticleListRow = {
  id: number;
  reportDate: Date;
  news: string;
  sectionLabel: string;
  hasFile: boolean;
};

export function parseNewsListParams(params: {
  page?: string;
  q?: string;
  section?: string;
}) {
  const page = Math.max(1, Number(params.page) || 1);
  const q = (params.q ?? "").trim();
  const sectionCode = Number(params.section) || 0;
  return { page, q, sectionCode };
}

export async function resolveNewsListPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE));
  return Math.min(page, totalPages);
}

export async function countNewsArticles(
  mainitemCode: number,
  q: string,
  sectionCode: number,
): Promise<number> {
  const conditions = [eq(newsArticles.mainitemCode, mainitemCode)];
  if (sectionCode > 0) {
    conditions.push(eq(newsArticles.sectionCode, sectionCode));
  }
  if (q.length >= 2) {
    conditions.push(like(newsArticles.news, `%${q}%`));
  }

  const [row] = await db
    .select({ total: count() })
    .from(newsArticles)
    .where(and(...conditions));

  return Number(row?.total ?? 0);
}

export async function listNewsArticlesPage(input: {
  mainitemCode: number;
  page: number;
  q: string;
  sectionCode: number;
}): Promise<NewsArticleListRow[]> {
  const offset = (input.page - 1) * NEWS_PAGE_SIZE;
  const conditions = [eq(newsArticles.mainitemCode, input.mainitemCode)];
  if (input.sectionCode > 0) {
    conditions.push(eq(newsArticles.sectionCode, input.sectionCode));
  }
  if (input.q.length >= 2) {
    conditions.push(like(newsArticles.news, `%${input.q}%`));
  }

  const rows = await db
    .select({
      id: newsArticles.id,
      reportDate: newsArticles.reportDate,
      news: newsArticles.news,
      sectionCode: newsArticles.sectionCode,
      file: newsArticles.file,
    })
    .from(newsArticles)
    .where(and(...conditions))
    .orderBy(desc(newsArticles.reportDate))
    .limit(NEWS_PAGE_SIZE)
    .offset(offset);

  const sections = await listNewsSectionsForMainitem(input.mainitemCode);
  const sectionMap = new Map(sections.map((s) => [s.code, s.name]));

  return rows.map((row) => ({
    id: row.id,
    reportDate: row.reportDate,
    news: row.news,
    sectionLabel: sectionMap.get(row.sectionCode) ?? String(row.sectionCode),
    hasFile: Boolean(row.file),
  }));
}

export async function getNewsArticle(id: number) {
  const [row] = await db
    .select()
    .from(newsArticles)
    .where(eq(newsArticles.id, id))
    .limit(1);
  return row ?? null;
}

export type NewsPermissionRow = {
  id: number;
  userId: number;
  personId: string;
  p1: number;
  officerPersonId: string | null;
  displayName: string;
};

export async function listNewsPermissions(): Promise<NewsPermissionRow[]> {
  const rows = await db
    .select({
      id: newsPermissions.id,
      userId: newsPermissions.userId,
      personId: users.personId,
      p1: newsPermissions.p1,
      officerPersonId: newsPermissions.officerPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(newsPermissions)
    .innerJoin(users, eq(newsPermissions.userId, users.id))
    .leftJoin(
      people,
      and(eq(people.personId, users.personId), eq(people.status, 0)),
    )
    .orderBy(asc(newsPermissions.id));

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

export async function getNewsModulePermission(id: number) {
  const rows = await listNewsPermissions();
  return rows.find((r) => r.id === id) ?? null;
}

export async function getNewsPermissionByUserId(userId: number) {
  const [row] = await db
    .select({ id: newsPermissions.id })
    .from(newsPermissions)
    .where(eq(newsPermissions.userId, userId))
    .limit(1);
  return row ?? null;
}

export type StaffOption = {
  userId: number;
  personId: string;
  label: string;
};

export async function listStaffForNewsPermissionPicker(
  excludeUserId?: number,
): Promise<StaffOption[]> {
  const existing = await db
    .select({ userId: newsPermissions.userId })
    .from(newsPermissions);

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
