import {
  and,
  asc,
  count,
  desc,
  eq,
  like,
  inArray,
  or,
  sql,
} from "drizzle-orm";
import { formatPersonName } from "@/lib/auth/format-name";
import { todayBangkokDateString } from "@/lib/bookregister/receive/ref-id";
import { db } from "@/lib/db";
import {
  idocumentComment,
  idocumentMain,
  idocumentSendto,
  people,
  workgroups,
} from "@/lib/db/schema";
import { positionLabel } from "@/lib/person/position-labels";

export const IDOCUMENT_PAGE_SIZE = 20;

export type IdocumentListRow = {
  id: number;
  bookNo: string;
  bookDate: string;
  subject: string;
  workgroupTxt: string;
  officerName: string;
  bookStatus: number;
  bookType: number;
  preDocId: string;
  bookTo: string;
};

export type IdocumentInboxRow = IdocumentListRow & {
  sendtoId: number;
  sendtoStatus: number | null;
};

export type IdocumentCommentRow = {
  id: number;
  personCommentsName: string;
  personCommentsPosition: string;
  commentsSelect: string | null;
  commentsTxt: string | null;
  commentsEtctxt: string | null;
  commentsDate: Date;
};

export type WorkgroupOption = {
  legacyCode: number;
  label: string;
};

export type RecipientOption = {
  personId: string;
  label: string;
};

export function parseIdocumentListParams(params: { page?: string; q?: string }) {
  const page = Math.max(1, Number(params.page) || 1);
  const q = (params.q ?? "").trim();
  return { page, q };
}

export async function resolveIdocumentListPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / IDOCUMENT_PAGE_SIZE));
  return Math.min(page, totalPages);
}

export function currentBuddhistYear(): number {
  return new Date().getFullYear() + 543;
}

function searchCondition(q: string) {
  if (q.length < 2) return undefined;
  const pattern = `%${q}%`;
  return or(
    like(idocumentMain.bookNo, pattern),
    like(idocumentMain.subject, pattern),
    like(idocumentMain.workgroupTxt, pattern),
    like(idocumentMain.officerName, pattern),
    like(idocumentMain.bookTo, pattern),
  );
}

function mapListRow(row: {
  id: number;
  bookNo: string;
  bookDate: string;
  subject: string;
  workgroupTxt: string;
  officerName: string;
  bookStatus: number;
  bookType: number;
  preDocId: string;
  bookTo: string;
}): IdocumentListRow {
  return {
    id: row.id,
    bookNo: row.bookNo,
    bookDate: row.bookDate,
    subject: row.subject,
    workgroupTxt: row.workgroupTxt,
    officerName: row.officerName,
    bookStatus: row.bookStatus,
    bookType: row.bookType,
    preDocId: row.preDocId,
    bookTo: row.bookTo,
  };
}

const listSelect = {
  id: idocumentMain.id,
  bookNo: idocumentMain.bookNo,
  bookDate: idocumentMain.bookDate,
  subject: idocumentMain.subject,
  workgroupTxt: idocumentMain.workgroupTxt,
  officerName: idocumentMain.officerName,
  bookStatus: idocumentMain.bookStatus,
  bookType: idocumentMain.bookType,
  preDocId: idocumentMain.preDocId,
  bookTo: idocumentMain.bookTo,
};

export async function countMyDocuments(
  officerPersonId: string,
  q: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(idocumentMain)
    .where(
      and(eq(idocumentMain.officer, officerPersonId), searchCondition(q)),
    );
  return Number(row?.total ?? 0);
}

export async function listMyDocumentsPage(input: {
  officerPersonId: string;
  page: number;
  q: string;
}): Promise<IdocumentListRow[]> {
  const offset = (input.page - 1) * IDOCUMENT_PAGE_SIZE;
  const rows = await db
    .select(listSelect)
    .from(idocumentMain)
    .where(
      and(eq(idocumentMain.officer, input.officerPersonId), searchCondition(input.q)),
    )
    .orderBy(desc(idocumentMain.id))
    .limit(IDOCUMENT_PAGE_SIZE)
    .offset(offset);

  return rows.map(mapListRow);
}

export async function countCompletedDocuments(input: {
  officerPersonId: string;
  viewAll: boolean;
  q: string;
}): Promise<number> {
  const statusFilter = inArray(idocumentMain.bookStatus, [5, 40]);
  const where = input.viewAll
    ? and(statusFilter, searchCondition(input.q))
    : and(
        statusFilter,
        eq(idocumentMain.officer, input.officerPersonId),
        searchCondition(input.q),
      );

  const [row] = await db.select({ total: count() }).from(idocumentMain).where(where);
  return Number(row?.total ?? 0);
}

export async function listCompletedDocumentsPage(input: {
  officerPersonId: string;
  viewAll: boolean;
  page: number;
  q: string;
}): Promise<IdocumentListRow[]> {
  const offset = (input.page - 1) * IDOCUMENT_PAGE_SIZE;
  const statusFilter = inArray(idocumentMain.bookStatus, [5, 40]);
  const where = input.viewAll
    ? and(statusFilter, searchCondition(input.q))
    : and(
        statusFilter,
        eq(idocumentMain.officer, input.officerPersonId),
        searchCondition(input.q),
      );

  const rows = await db
    .select(listSelect)
    .from(idocumentMain)
    .where(where)
    .orderBy(desc(idocumentMain.id))
    .limit(IDOCUMENT_PAGE_SIZE)
    .offset(offset);

  return rows.map(mapListRow);
}

export async function countInboxDocuments(
  personId: string,
  q: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(idocumentSendto)
    .innerJoin(
      idocumentMain,
      and(
        eq(idocumentMain.id, idocumentSendto.documentId),
        eq(idocumentMain.preDocId, "1"),
      ),
    )
    .where(
      and(
        eq(idocumentSendto.personId, personId),
        inArray(idocumentSendto.status, [1, 2, 3]),
        searchCondition(q),
      ),
    );
  return Number(row?.total ?? 0);
}

export async function listInboxDocumentsPage(input: {
  personId: string;
  page: number;
  q: string;
}): Promise<IdocumentInboxRow[]> {
  const offset = (input.page - 1) * IDOCUMENT_PAGE_SIZE;
  const rows = await db
    .select({
      ...listSelect,
      sendtoId: idocumentSendto.id,
      sendtoStatus: idocumentSendto.status,
    })
    .from(idocumentSendto)
    .innerJoin(
      idocumentMain,
      and(
        eq(idocumentMain.id, idocumentSendto.documentId),
        eq(idocumentMain.preDocId, "1"),
      ),
    )
    .where(
      and(
        eq(idocumentSendto.personId, input.personId),
        inArray(idocumentSendto.status, [1, 2, 3]),
        searchCondition(input.q),
      ),
    )
    .orderBy(desc(idocumentSendto.id))
    .limit(IDOCUMENT_PAGE_SIZE)
    .offset(offset);

  return rows.map((row) => ({
    ...mapListRow(row),
    sendtoId: row.sendtoId,
    sendtoStatus: row.sendtoStatus,
  }));
}

export async function getDocumentById(id: number) {
  const [row] = await db
    .select()
    .from(idocumentMain)
    .where(eq(idocumentMain.id, id))
    .limit(1);
  return row ?? null;
}

export async function listDocumentComments(
  documentId: number,
): Promise<IdocumentCommentRow[]> {
  const rows = await db
    .select({
      id: idocumentComment.id,
      personCommentsName: idocumentComment.personCommentsName,
      personCommentsPosition: idocumentComment.personCommentsPosition,
      commentsSelect: idocumentComment.commentsSelect,
      commentsTxt: idocumentComment.commentsTxt,
      commentsEtctxt: idocumentComment.commentsEtctxt,
      commentsDate: idocumentComment.commentsDate,
    })
    .from(idocumentComment)
    .where(eq(idocumentComment.documentId, documentId))
    .orderBy(asc(idocumentComment.id));

  return rows;
}

export async function listWorkgroupOptions(): Promise<WorkgroupOption[]> {
  const rows = await db
    .select({
      legacyCode: workgroups.legacyCode,
      name: workgroups.name,
    })
    .from(workgroups)
    .where(eq(workgroups.active, true))
    .orderBy(asc(workgroups.legacyCode));

  return rows
    .filter((row) => row.legacyCode !== null)
    .map((row) => ({
      legacyCode: row.legacyCode!,
      label: row.name,
    }));
}

export async function listRecipientOptions(): Promise<RecipientOption[]> {
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
        eq(people.status, 0),
        sql`${people.positionCode} IS NOT NULL`,
        sql`${people.positionCode} < 4`,
      ),
    )
    .orderBy(asc(people.positionCode), asc(people.firstName));

  return rows.map((row) => {
    const name =
      formatPersonName({
        prefix: row.prefix,
        firstName: row.firstName,
        lastName: row.lastName,
        fallback: row.personId,
      }) || row.personId;
    const position = positionLabel(row.positionCode);
    return {
      personId: row.personId,
      label: position ? `${name} — ${position}` : name,
    };
  });
}

export async function getDefaultWorkgroupForPerson(personId: string): Promise<{
  workgroup: number;
  workgroupTxt: string;
} | null> {
  const [row] = await db
    .select({
      legacyCode: workgroups.legacyCode,
      name: workgroups.name,
    })
    .from(people)
    .leftJoin(workgroups, eq(people.workgroupId, workgroups.id))
    .where(eq(people.personId, personId))
    .limit(1);

  if (!row?.legacyCode || !row.name) return null;
  return {
    workgroup: row.legacyCode,
    workgroupTxt: row.name,
  };
}

export async function allocateNextBookNumber(bookYear: number): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(idocumentMain)
    .where(eq(idocumentMain.bookYear, bookYear));
  return Number(row?.total ?? 0) + 1;
}

export async function getOfficerProfile(personId: string) {
  const [row] = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      positionCode: people.positionCode,
    })
    .from(people)
    .where(eq(people.personId, personId))
    .limit(1);

  if (!row) return null;

  const name =
    formatPersonName({
      prefix: row.prefix,
      firstName: row.firstName,
      lastName: row.lastName,
      fallback: row.personId,
    }) || row.personId;

  return {
    personId: row.personId,
    name,
    position: positionLabel(row.positionCode),
  };
}

export function formatBookNo(bookNumber: number, bookYear: number): string {
  return `${bookNumber}/${bookYear}`;
}

export function todayDocumentDate(): string {
  return todayBangkokDateString();
}

export async function getDocumentRecipientPersonId(
  documentId: number,
): Promise<string | null> {
  const [row] = await db
    .select({ personId: idocumentSendto.personId })
    .from(idocumentSendto)
    .where(
      and(
        eq(idocumentSendto.documentId, documentId),
        inArray(idocumentSendto.status, [1, 2, 3]),
      ),
    )
    .orderBy(desc(idocumentSendto.id))
    .limit(1);
  return row?.personId ?? null;
}
