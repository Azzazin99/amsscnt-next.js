import {
  and,
  asc,
  count,
  desc,
  eq,
  like,
  inArray,
  isNull,
  lt,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { bangkokCutoffDaysAgo, bangkokCutoffYearsAgo } from "@/lib/book/dates";
import { db } from "@/lib/db";
import {
  bookDocuments,
  bookFiles,
  bookGroupMembers,
  bookGroups,
  bookRecipients,
  schools,
} from "@/lib/db/schema";
import { inboxSendTo, type BookScope } from "@/lib/book/scope";

export const BOOK_PAGE_SIZE = 25;

export type BookListRow = {
  id: number;
  refId: string;
  bookNo: string;
  signDate: string | null;
  subject: string;
  sendDate: Date;
  urgencyLevel: number;
  secretLevel: number;
  bookType: number;
  senderLabel: string;
  recipientCount: number;
  answered: boolean | null;
};

export type BookInboxFilter = "all" | "overdue_unack" | "aged_2y";

export function parseBookListParams(params: {
  page?: string;
  q?: string;
  ack?: string;
}) {
  const page = Math.max(1, Number(params.page) || 1);
  const q = (params.q ?? "").trim();
  const ack = params.ack === "pending" || params.ack === "done" ? params.ack : "all";
  return { page, q, ack };
}

export async function resolveBookListPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / BOOK_PAGE_SIZE));
  return Math.min(page, totalPages);
}

function searchCondition(q: string) {
  if (q.length < 2) return undefined;
  const pattern = `%${q}%`;
  return or(
    like(bookDocuments.subject, pattern),
    like(bookDocuments.bookNo, pattern),
  );
}

export type BookSentFilter = "all" | "circulation";

export function parseBookSentParams(params: {
  page?: string;
  q?: string;
  type?: string;
}): { page: number; q: string; type: BookSentFilter } {
  const page = Math.max(1, Number(params.page) || 1);
  const q = (params.q ?? "").trim();
  const type: BookSentFilter =
    params.type === "circulation" ? "circulation" : "all";
  return { page, q, type };
}

function sentScopeCondition(scope: BookScope) {
  if (scope.kind === "district") {
    return isNull(bookDocuments.senderSchoolId);
  }
  return and(
    eq(bookDocuments.bookType, 2),
    eq(bookDocuments.senderSchoolId, scope.schoolId),
  );
}

function sentTypeCondition(type: BookSentFilter) {
  if (type === "circulation") {
    return eq(bookDocuments.bookType, 3);
  }
  return undefined;
}

function inboxRecipientJoin(scope: BookScope) {
  return and(
    eq(bookRecipients.refId, bookDocuments.refId),
    eq(bookRecipients.sendTo, inboxSendTo(scope)),
  );
}

function inboxSearchWhere(q: string) {
  const condition = searchCondition(q);
  return condition ? [condition] : [];
}

function inboxDocumentFilterWhere(filter: BookInboxFilter) {
  if (filter === "overdue_unack") {
    return lt(bookDocuments.sendDate, bangkokCutoffDaysAgo(3));
  }
  if (filter === "aged_2y") {
    // legacy amsscnt.com: อายุนับจากลงวันที่หนังสือ (sign_date)
    return lte(bookDocuments.signDate, bangkokCutoffYearsAgo(2));
  }
  return undefined;
}

function inboxAckHaving(ack: string, filter: BookInboxFilter) {
  if (filter === "overdue_unack") {
    return sql`MIN(CASE WHEN ${bookRecipients.answered} THEN 1 ELSE 0 END) = 0`;
  }
  if (ack === "pending") {
    return sql`MIN(CASE WHEN ${bookRecipients.answered} THEN 1 ELSE 0 END) = 0`;
  }
  if (ack === "done") {
    return sql`MIN(CASE WHEN ${bookRecipients.answered} THEN 1 ELSE 0 END) = 1`;
  }
  return undefined;
}

function inboxDocumentIdsSubquery(input: {
  scope: BookScope;
  q: string;
  ack: string;
  filter: BookInboxFilter;
}) {
  const searchWhere = inboxSearchWhere(input.q);
  const docFilter = inboxDocumentFilterWhere(input.filter);
  const ackHaving = inboxAckHaving(input.ack, input.filter);

  let query = db
    .select({ id: bookDocuments.id })
    .from(bookDocuments)
    .innerJoin(bookRecipients, inboxRecipientJoin(input.scope))
    .groupBy(bookDocuments.id)
    .$dynamic();

  const whereConditions = [...searchWhere, docFilter].filter(Boolean);
  if (whereConditions.length > 0) {
    query = query.where(and(...whereConditions));
  }
  if (ackHaving) {
    query = query.having(ackHaving);
  }

  return query.as("inbox_docs");
}

export async function countBookInbox(
  scope: BookScope,
  q: string,
  ack: string,
  filter: BookInboxFilter = "all",
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(inboxDocumentIdsSubquery({ scope, q, ack, filter }));

  return Number(row?.total ?? 0);
}

export async function listBookInboxPage(input: {
  scope: BookScope;
  page: number;
  q: string;
  ack: string;
  filter?: BookInboxFilter;
}): Promise<BookListRow[]> {
  const filter = input.filter ?? "all";
  const offset = (input.page - 1) * BOOK_PAGE_SIZE;
  const searchWhere = inboxSearchWhere(input.q);
  const docFilter = inboxDocumentFilterWhere(filter);
  const ackHaving = inboxAckHaving(input.ack, filter);

  let query = db
    .select({
      id: bookDocuments.id,
      refId: bookDocuments.refId,
      bookNo: bookDocuments.bookNo,
      signDate: bookDocuments.signDate,
      subject: bookDocuments.subject,
      sendDate: bookDocuments.sendDate,
      urgencyLevel: bookDocuments.urgencyLevel,
      secretLevel: bookDocuments.secretLevel,
      bookType: bookDocuments.bookType,
      officeCode: bookDocuments.officeCode,
      answered: sql<boolean>`MIN(CASE WHEN ${bookRecipients.answered} THEN 1 ELSE 0 END) = 1`,
      recipientCount: sql<number>`(
        SELECT COUNT(*) FROM book_recipients br
        WHERE br.ref_id = ${bookDocuments.refId}
      )`,
    })
    .from(bookDocuments)
    .innerJoin(bookRecipients, inboxRecipientJoin(input.scope))
    .groupBy(
      bookDocuments.id,
      bookDocuments.refId,
      bookDocuments.bookNo,
      bookDocuments.signDate,
      bookDocuments.subject,
      bookDocuments.sendDate,
      bookDocuments.urgencyLevel,
      bookDocuments.secretLevel,
      bookDocuments.bookType,
      bookDocuments.officeCode,
    )
    .orderBy(desc(bookDocuments.sendDate))
    .limit(BOOK_PAGE_SIZE)
    .offset(offset)
    .$dynamic();

  const whereConditions = [...searchWhere, docFilter].filter(Boolean);
  if (whereConditions.length > 0) {
    query = query.where(and(...whereConditions));
  }
  if (ackHaving) {
    query = query.having(ackHaving);
  }

  const rows = await query;

  return rows.map((row) => ({
    id: row.id,
    refId: row.refId,
    bookNo: row.bookNo,
    signDate: row.signDate,
    subject: row.subject,
    sendDate: row.sendDate,
    urgencyLevel: row.urgencyLevel,
    secretLevel: row.secretLevel,
    bookType: row.bookType,
    senderLabel: formatSenderLabel(row.officeCode, row.bookType),
    recipientCount: Number(row.recipientCount),
    answered: row.answered,
  }));
}

export async function countBookSent(
  scope: BookScope,
  q: string,
  type: BookSentFilter = "all",
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(bookDocuments)
    .where(
      and(sentScopeCondition(scope), searchCondition(q), sentTypeCondition(type)),
    );

  return Number(row?.total ?? 0);
}

export async function listBookSentPage(input: {
  scope: BookScope;
  page: number;
  q: string;
  type?: BookSentFilter;
}): Promise<BookListRow[]> {
  const type = input.type ?? "all";
  const offset = (input.page - 1) * BOOK_PAGE_SIZE;

  const rows = await db
    .select({
      id: bookDocuments.id,
      refId: bookDocuments.refId,
      bookNo: bookDocuments.bookNo,
      signDate: bookDocuments.signDate,
      subject: bookDocuments.subject,
      sendDate: bookDocuments.sendDate,
      urgencyLevel: bookDocuments.urgencyLevel,
      secretLevel: bookDocuments.secretLevel,
      bookType: bookDocuments.bookType,
      officeCode: bookDocuments.officeCode,
      recipientCount: sql<number>`(
        SELECT COUNT(*) FROM book_recipients br
        WHERE br.ref_id = ${bookDocuments.refId}
      )`,
    })
    .from(bookDocuments)
    .where(
      and(
        sentScopeCondition(input.scope),
        searchCondition(input.q),
        sentTypeCondition(type),
      ),
    )
    .orderBy(desc(bookDocuments.sendDate))
    .limit(BOOK_PAGE_SIZE)
    .offset(offset);

  return rows.map((row) => ({
    id: row.id,
    refId: row.refId,
    bookNo: row.bookNo,
    signDate: row.signDate,
    subject: row.subject,
    sendDate: row.sendDate,
    urgencyLevel: row.urgencyLevel,
    secretLevel: row.secretLevel,
    bookType: row.bookType,
    senderLabel: formatSenderLabel(row.officeCode, row.bookType),
    recipientCount: Number(row.recipientCount),
    answered: null,
  }));
}

function formatSenderLabel(officeCode: string, bookType: number): string {
  if (bookType === 1) return "สำนักงานเขต";
  if (bookType === 3) return "หนังสือเวียน";
  if (bookType === 6) return "ส่งต่อจากทะเบียน";
  return officeCode;
}

export type BookDetail = {
  id: number;
  refId: string;
  bookType: number;
  bookNo: string;
  signDate: string | null;
  subject: string;
  detail: string | null;
  sendDate: Date;
  urgencyLevel: number;
  secretLevel: number;
  senderPersonId: string;
  officeCode: string;
  senderSchoolId: number | null;
  bookRegisLink: number;
};

export async function getBookDocument(id: number): Promise<BookDetail | null> {
  const [row] = await db
    .select({
      id: bookDocuments.id,
      refId: bookDocuments.refId,
      bookType: bookDocuments.bookType,
      bookNo: bookDocuments.bookNo,
      signDate: bookDocuments.signDate,
      subject: bookDocuments.subject,
      detail: bookDocuments.detail,
      sendDate: bookDocuments.sendDate,
      urgencyLevel: bookDocuments.urgencyLevel,
      secretLevel: bookDocuments.secretLevel,
      senderPersonId: bookDocuments.senderPersonId,
      officeCode: bookDocuments.officeCode,
      senderSchoolId: bookDocuments.senderSchoolId,
      bookRegisLink: bookDocuments.bookRegisLink,
    })
    .from(bookDocuments)
    .where(eq(bookDocuments.id, id))
    .limit(1);

  return row ?? null;
}

export async function canViewBookDocument(
  doc: BookDetail,
  scope: BookScope,
): Promise<boolean> {
  const sendTo = inboxSendTo(scope);
  const sentMatch =
    scope.kind === "district"
      ? doc.senderSchoolId == null
      : doc.senderSchoolId === scope.schoolId;

  if (sentMatch) return true;

  const [inboxRow] = await db
    .select({ id: bookRecipients.id })
    .from(bookRecipients)
    .where(
      and(
        eq(bookRecipients.refId, doc.refId),
        eq(bookRecipients.sendTo, sendTo),
      ),
    )
    .limit(1);

  return inboxRow != null;
}

export async function listBookRecipients(refId: string) {
  return db
    .select({
      id: bookRecipients.id,
      sendTo: bookRecipients.sendTo,
      sendLevel: bookRecipients.sendLevel,
      answered: bookRecipients.answered,
      answeredAt: bookRecipients.answeredAt,
    })
    .from(bookRecipients)
    .where(eq(bookRecipients.refId, refId))
    .orderBy(asc(bookRecipients.id));
}

export async function listBookFiles(refId: string) {
  return db
    .select({
      id: bookFiles.id,
      fileName: bookFiles.fileName,
      fileDes: bookFiles.fileDes,
    })
    .from(bookFiles)
    .where(eq(bookFiles.refId, refId))
    .orderBy(asc(bookFiles.id));
}

export async function getInboxRecipientRow(refId: string, scope: BookScope) {
  const sendTo = inboxSendTo(scope);
  const [row] = await db
    .select({
      id: bookRecipients.id,
      answered: bookRecipients.answered,
    })
    .from(bookRecipients)
    .where(
      and(eq(bookRecipients.refId, refId), eq(bookRecipients.sendTo, sendTo)),
    )
    .limit(1);

  return row ?? null;
}

export async function listActiveSchoolsForBook() {
  return db
    .select({
      id: schools.id,
      schoolCode: schools.schoolCode,
      name: schools.name,
    })
    .from(schools)
    .where(eq(schools.active, true))
    .orderBy(asc(schools.schoolCode));
}

export async function listBookGroupsForSelect() {
  return db
    .select({
      id: bookGroups.id,
      name: bookGroups.name,
    })
    .from(bookGroups)
    .orderBy(asc(bookGroups.sortOrder), asc(bookGroups.name));
}

export async function resolveSchoolCodesByIds(ids: number[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select({ schoolCode: schools.schoolCode })
    .from(schools)
    .where(inArray(schools.id, ids));
  return rows.map((r) => r.schoolCode);
}

export async function resolveGroupMemberSchoolCodes(
  groupId: number,
): Promise<string[]> {
  const rows = await db
    .select({ schoolCode: schools.schoolCode })
    .from(bookGroupMembers)
    .innerJoin(schools, eq(schools.id, bookGroupMembers.schoolId))
    .where(eq(bookGroupMembers.groupId, groupId));
  return rows.map((r) => r.schoolCode);
}

export async function listAllActiveSchoolCodes(): Promise<string[]> {
  const rows = await db
    .select({ schoolCode: schools.schoolCode })
    .from(schools)
    .where(eq(schools.active, true))
    .orderBy(asc(schools.schoolCode));
  return rows.map((r) => r.schoolCode);
}
