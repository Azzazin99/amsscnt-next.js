import {
  and,
  asc,
  count,
  desc,
  eq,
  like,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { sortWorkgroupsForMailCompose } from "@/lib/mail/recipient-options";
import { formatPersonName } from "@/lib/auth/format-name";
import { db } from "@/lib/db";
import {
  mailDocuments,
  mailFiles,
  mailGroupMembers,
  mailGroups,
  mailPermissions,
  mailRecipients,
  people,
  schools,
  users,
  workgroups,
} from "@/lib/db/schema";

export const MAIL_PAGE_SIZE = 25;

export type MailListRow = {
  id: number;
  refId: string;
  subject: string;
  sendDate: Date;
  senderLabel: string;
  recipientCount: number;
  answered: boolean | null;
};

export function parseMailListParams(params: {
  page?: string;
  q?: string;
  ack?: string;
}) {
  const page = Math.max(1, Number(params.page) || 1);
  const q = (params.q ?? "").trim();
  const ack = params.ack === "pending" || params.ack === "done" ? params.ack : "all";
  return { page, q, ack };
}

export async function resolveMailListPage(
  total: number,
  page: number,
): Promise<number> {
  const totalPages = Math.max(1, Math.ceil(total / MAIL_PAGE_SIZE));
  return Math.min(page, totalPages);
}

function searchCondition(q: string) {
  if (q.length < 2) return undefined;
  const pattern = `%${q}%`;
  return or(
    like(mailDocuments.subject, pattern),
    like(mailDocuments.detail, pattern),
  );
}

function inboxRecipientJoin(personId: string) {
  return and(
    eq(mailRecipients.refId, mailDocuments.refId),
    eq(mailRecipients.sendTo, personId),
  );
}

function inboxSearchWhere(q: string) {
  const condition = searchCondition(q);
  return condition ? [condition] : [];
}

function inboxAckHaving(ack: string) {
  if (ack === "pending") {
    return sql`MIN(CASE WHEN ${mailRecipients.answered} THEN 1 ELSE 0 END) = 0`;
  }
  if (ack === "done") {
    return sql`MIN(CASE WHEN ${mailRecipients.answered} THEN 1 ELSE 0 END) = 1`;
  }
  return undefined;
}

function inboxDocumentIdsSubquery(input: {
  personId: string;
  q: string;
  ack: string;
}) {
  const searchWhere = inboxSearchWhere(input.q);
  const ackHaving = inboxAckHaving(input.ack);

  let query = db
    .select({ id: mailDocuments.id })
    .from(mailDocuments)
    .innerJoin(mailRecipients, inboxRecipientJoin(input.personId))
    .groupBy(mailDocuments.id)
    .$dynamic();

  if (searchWhere.length > 0) {
    query = query.where(and(...searchWhere));
  }
  if (ackHaving) {
    query = query.having(ackHaving);
  }

  return query.as("inbox_docs");
}

export async function countMailInbox(
  personId: string,
  q: string,
  ack: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(inboxDocumentIdsSubquery({ personId, q, ack }));

  return Number(row?.total ?? 0);
}

export async function listMailInboxPage(input: {
  personId: string;
  page: number;
  q: string;
  ack: string;
}): Promise<MailListRow[]> {
  const offset = (input.page - 1) * MAIL_PAGE_SIZE;
  const searchWhere = inboxSearchWhere(input.q);
  const ackHaving = inboxAckHaving(input.ack);

  let query = db
    .select({
      id: mailDocuments.id,
      refId: mailDocuments.refId,
      subject: mailDocuments.subject,
      sendDate: mailDocuments.sendDate,
      senderPersonId: mailDocuments.senderPersonId,
      answered: sql<boolean>`MIN(CASE WHEN ${mailRecipients.answered} THEN 1 ELSE 0 END) = 1`,
      recipientCount: sql<number>`(
        SELECT COUNT(*) FROM mail_recipients mr
        WHERE mr.ref_id = ${mailDocuments.refId}
      )`,
    })
    .from(mailDocuments)
    .innerJoin(mailRecipients, inboxRecipientJoin(input.personId))
    .groupBy(
      mailDocuments.id,
      mailDocuments.refId,
      mailDocuments.subject,
      mailDocuments.sendDate,
      mailDocuments.senderPersonId,
    )
    .orderBy(desc(mailDocuments.sendDate))
    .limit(MAIL_PAGE_SIZE)
    .offset(offset)
    .$dynamic();

  if (searchWhere.length > 0) {
    query = query.where(and(...searchWhere));
  }
  if (ackHaving) {
    query = query.having(ackHaving);
  }

  const rows = await query;

  const senderLabels = await resolvePersonLabels(
    rows.map((r) => r.senderPersonId),
  );

  return rows.map((row) => ({
    id: row.id,
    refId: row.refId,
    subject: row.subject,
    sendDate: row.sendDate,
    senderLabel: senderLabels.get(row.senderPersonId) ?? row.senderPersonId,
    recipientCount: Number(row.recipientCount),
    answered: row.answered,
  }));
}

export async function countMailSent(
  senderPersonId: string,
  q: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(mailDocuments)
    .where(
      and(eq(mailDocuments.senderPersonId, senderPersonId), searchCondition(q)),
    );

  return Number(row?.total ?? 0);
}

export async function listMailSentPage(input: {
  senderPersonId: string;
  page: number;
  q: string;
}): Promise<MailListRow[]> {
  const offset = (input.page - 1) * MAIL_PAGE_SIZE;

  const rows = await db
    .select({
      id: mailDocuments.id,
      refId: mailDocuments.refId,
      subject: mailDocuments.subject,
      sendDate: mailDocuments.sendDate,
      senderPersonId: mailDocuments.senderPersonId,
      recipientCount: sql<number>`(
        SELECT COUNT(*) FROM mail_recipients mr
        WHERE mr.ref_id = ${mailDocuments.refId}
      )`,
    })
    .from(mailDocuments)
    .where(
      and(
        eq(mailDocuments.senderPersonId, input.senderPersonId),
        searchCondition(input.q),
      ),
    )
    .orderBy(desc(mailDocuments.sendDate))
    .limit(MAIL_PAGE_SIZE)
    .offset(offset);

  const senderLabels = await resolvePersonLabels(
    rows.map((r) => r.senderPersonId),
  );

  return rows.map((row) => ({
    id: row.id,
    refId: row.refId,
    subject: row.subject,
    sendDate: row.sendDate,
    senderLabel: senderLabels.get(row.senderPersonId) ?? row.senderPersonId,
    recipientCount: Number(row.recipientCount),
    answered: null,
  }));
}

export type MailDetail = {
  id: number;
  refId: string;
  subject: string;
  detail: string | null;
  sendDate: Date;
  senderPersonId: string;
};

export async function getMailDocument(id: number): Promise<MailDetail | null> {
  const [row] = await db
    .select({
      id: mailDocuments.id,
      refId: mailDocuments.refId,
      subject: mailDocuments.subject,
      detail: mailDocuments.detail,
      sendDate: mailDocuments.sendDate,
      senderPersonId: mailDocuments.senderPersonId,
    })
    .from(mailDocuments)
    .where(eq(mailDocuments.id, id))
    .limit(1);

  return row ?? null;
}

export async function canViewMailDocument(
  doc: MailDetail,
  personId: string,
): Promise<boolean> {
  if (doc.senderPersonId === personId) return true;

  const [inboxRow] = await db
    .select({ id: mailRecipients.id })
    .from(mailRecipients)
    .where(
      and(
        eq(mailRecipients.refId, doc.refId),
        eq(mailRecipients.sendTo, personId),
      ),
    )
    .limit(1);

  return inboxRow != null;
}

export async function listMailRecipients(refId: string) {
  const rows = await db
    .select({
      id: mailRecipients.id,
      sendTo: mailRecipients.sendTo,
      answered: mailRecipients.answered,
      answeredAt: mailRecipients.answeredAt,
    })
    .from(mailRecipients)
    .where(eq(mailRecipients.refId, refId))
    .orderBy(asc(mailRecipients.id));

  const labels = await resolvePersonLabels(rows.map((r) => r.sendTo));

  const seenSendTo = new Set<string>();
  const uniqueRows = rows.filter((row) => {
    if (seenSendTo.has(row.sendTo)) return false;
    seenSendTo.add(row.sendTo);
    return true;
  });

  return uniqueRows.map((row) => ({
    ...row,
    label: labels.get(row.sendTo) ?? row.sendTo,
  }));
}

export async function listMailFiles(refId: string) {
  return db
    .select({
      id: mailFiles.id,
      fileName: mailFiles.fileName,
      fileDes: mailFiles.fileDes,
    })
    .from(mailFiles)
    .where(eq(mailFiles.refId, refId))
    .orderBy(asc(mailFiles.id));
}

export async function getInboxRecipientRow(refId: string, personId: string) {
  const [row] = await db
    .select({
      id: mailRecipients.id,
      answered: mailRecipients.answered,
    })
    .from(mailRecipients)
    .where(
      and(eq(mailRecipients.refId, refId), eq(mailRecipients.sendTo, personId)),
    )
    .limit(1);

  return row ?? null;
}

export async function listAllActivePersonIds(): Promise<string[]> {
  const rows = await db
    .select({ personId: people.personId })
    .from(people)
    .where(eq(people.status, 0))
    .orderBy(asc(people.personId));
  return rows.map((r) => r.personId);
}

export async function resolveGroupMemberPersonIds(
  groupId: number,
): Promise<string[]> {
  const rows = await db
    .select({ personId: mailGroupMembers.personId })
    .from(mailGroupMembers)
    .where(eq(mailGroupMembers.groupId, groupId));
  return rows.map((r) => r.personId);
}

export async function listMailGroupsForSelect() {
  return db
    .select({
      id: mailGroups.id,
      name: mailGroups.name,
    })
    .from(mailGroups)
    .orderBy(asc(mailGroups.sortOrder), asc(mailGroups.name));
}

export type WorkgroupOption = {
  id: number;
  name: string;
};

export async function listWorkgroupsForMailCompose(): Promise<WorkgroupOption[]> {
  const rows = await db
    .select({
      id: workgroups.id,
      name: workgroups.name,
      legacyCode: workgroups.legacyCode,
      sortOrder: workgroups.sortOrder,
    })
    .from(workgroups)
    .where(eq(workgroups.active, true));

  const sorted = sortWorkgroupsForMailCompose(rows);
  const ordered =
    sorted.length > 0
      ? sorted
      : [...rows]
          .filter((row) => row.legacyCode !== 0)
          .sort(
            (a, b) =>
              a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "th"),
          );

  return ordered.map(({ id, name }) => ({ id, name }));
}

export async function resolveWorkgroupMemberPersonIds(
  workgroupId: number,
): Promise<string[]> {
  if (workgroupId <= 0) return [];

  const rows = await db
    .select({ personId: people.personId })
    .from(people)
    .where(
      and(
        eq(people.workgroupId, workgroupId),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .orderBy(asc(people.personId));

  return rows.map((r) => r.personId);
}

export type WorkgroupMemberGroupOption = {
  workgroupId: number;
  workgroupName: string;
  members: PersonOption[];
};

export async function listWorkgroupMembersByWorkgroupForMailPicker(): Promise<
  WorkgroupMemberGroupOption[]
> {
  const composeWorkgroups = await listWorkgroupsForMailCompose();
  if (composeWorkgroups.length === 0) return [];

  const workgroupIds = composeWorkgroups.map((group) => group.id);

  const rows = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      workgroupId: people.workgroupId,
    })
    .from(people)
    .where(
      and(
        inArray(people.workgroupId, workgroupIds),
        eq(people.organizationType, "district"),
        eq(people.status, 0),
      ),
    )
    .orderBy(asc(people.firstName), asc(people.lastName));

  const membersByWorkgroup = new Map<number, PersonOption[]>();

  for (const row of rows) {
    if (row.workgroupId == null) continue;

    const member: PersonOption = {
      personId: row.personId,
      label:
        formatPersonName({
          prefix: row.prefix,
          firstName: row.firstName,
          lastName: row.lastName,
          fallback: row.personId,
        }) || row.personId,
    };

    const existing = membersByWorkgroup.get(row.workgroupId) ?? [];
    existing.push(member);
    membersByWorkgroup.set(row.workgroupId, existing);
  }

  return composeWorkgroups.map(({ id, name }) => ({
    workgroupId: id,
    workgroupName: name,
    members: membersByWorkgroup.get(id) ?? [],
  }));
}

/** บุคลากรโรงเรียนที่ไม่ใช่ผู้อำนวยการ — legacy ใช้ position_code หลายค่า (3, 13, 32 ฯลฯ) */
function schoolStaffCondition() {
  return and(
    eq(people.organizationType, "school"),
    eq(people.status, 0),
    or(isNull(people.positionCode), ne(people.positionCode, 1)),
  );
}

/** legacy person_position: 6 = เจ้าพนักงานธุรการ */
function districtClerkCondition() {
  return and(
    eq(people.organizationType, "district"),
    eq(people.status, 0),
    eq(people.positionCode, 6),
  );
}

export type DistrictClerkGroupOption = {
  workgroupId: number | null;
  workgroupName: string;
  clerks: PersonOption[];
};

export async function listDistrictClerksByWorkgroupForMailPicker(): Promise<
  DistrictClerkGroupOption[]
> {
  const rows = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      workgroupId: people.workgroupId,
      workgroupName: workgroups.name,
      workgroupLegacyCode: workgroups.legacyCode,
      workgroupSortOrder: workgroups.sortOrder,
    })
    .from(people)
    .leftJoin(workgroups, eq(people.workgroupId, workgroups.id))
    .where(districtClerkCondition())
    .orderBy(asc(people.firstName), asc(people.lastName));

  const groupMap = new Map<number | null, DistrictClerkGroupOption>();
  const groupMeta = new Map<
    number | null,
    { legacyCode: number | null; sortOrder: number }
  >();

  for (const row of rows) {
    const key = row.workgroupId;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        workgroupId: key,
        workgroupName: row.workgroupName ?? "ไม่ระบุกลุ่ม",
        clerks: [],
      });
      groupMeta.set(key, {
        legacyCode: row.workgroupLegacyCode,
        sortOrder: row.workgroupSortOrder ?? 9999,
      });
    }

    groupMap.get(key)!.clerks.push({
      personId: row.personId,
      label:
        formatPersonName({
          prefix: row.prefix,
          firstName: row.firstName,
          lastName: row.lastName,
          fallback: row.personId,
        }) || row.personId,
    });
  }

  const workgroupOrder = new Map(
    sortWorkgroupsForMailCompose(
      [...groupMap.entries()]
        .filter(([id]) => id != null)
        .map(([id, group]) => ({
          id: id!,
          name: group.workgroupName,
          legacyCode: groupMeta.get(id)?.legacyCode ?? null,
          sortOrder: groupMeta.get(id)?.sortOrder ?? 9999,
        })),
    ).map((group, index) => [group.id, index]),
  );

  return [...groupMap.entries()]
    .sort(([aId], [bId]) => {
      if (aId == null) return 1;
      if (bId == null) return -1;
      const aOrder = workgroupOrder.get(aId) ?? 999;
      const bOrder = workgroupOrder.get(bId) ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (
        (groupMeta.get(aId)?.sortOrder ?? 9999) -
        (groupMeta.get(bId)?.sortOrder ?? 9999)
      );
    })
    .map(([, group]) => group)
    .filter((group) => group.clerks.length > 0);
}

/** legacy: ธุรการกลุ่ม/หน่วย — position_code 6 เจ้าพนักงานธุรการ */
export async function resolveDistrictClerkPersonIds(): Promise<string[]> {
  const rows = await db
    .select({ personId: people.personId })
    .from(people)
    .where(districtClerkCondition())
    .orderBy(asc(people.personId));

  return rows.map((r) => r.personId);
}

export type SchoolDirectorGroupOption = {
  schoolId: number | null;
  schoolName: string;
  directors: PersonOption[];
};

export async function listSchoolDirectorsBySchoolForMailPicker(): Promise<
  SchoolDirectorGroupOption[]
> {
  const rows = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      schoolId: people.schoolId,
      schoolName: schools.name,
      schoolCode: schools.schoolCode,
    })
    .from(people)
    .leftJoin(schools, eq(people.schoolId, schools.id))
    .where(
      and(
        eq(people.organizationType, "school"),
        eq(people.status, 0),
        eq(people.positionCode, 1),
      ),
    )
    .orderBy(asc(schools.schoolCode), asc(people.firstName), asc(people.lastName));

  const groupMap = new Map<number | null, SchoolDirectorGroupOption>();
  const schoolCodes = new Map<number | null, string>();

  for (const row of rows) {
    const key = row.schoolId;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        schoolId: key,
        schoolName: row.schoolName ?? "ไม่ระบุโรงเรียน",
        directors: [],
      });
      schoolCodes.set(key, row.schoolCode ?? "");
    }

    groupMap.get(key)!.directors.push({
      personId: row.personId,
      label:
        formatPersonName({
          prefix: row.prefix,
          firstName: row.firstName,
          lastName: row.lastName,
          fallback: row.personId,
        }) || row.personId,
    });
  }

  return [...groupMap.entries()]
    .sort(([aId], [bId]) => {
      if (aId == null) return 1;
      if (bId == null) return -1;
      return (schoolCodes.get(aId) ?? "").localeCompare(
        schoolCodes.get(bId) ?? "",
        "th",
      );
    })
    .map(([, group]) => group)
    .filter((group) => group.directors.length > 0);
}

/** legacy: ผู้อำนวยการโรงเรียน */
export async function resolveSchoolDirectorPersonIds(): Promise<string[]> {
  const rows = await db
    .select({ personId: people.personId })
    .from(people)
    .where(
      and(
        eq(people.organizationType, "school"),
        eq(people.status, 0),
        eq(people.positionCode, 1),
      ),
    )
    .orderBy(asc(people.personId));

  return rows.map((r) => r.personId);
}

export type SchoolStaffGroupOption = {
  schoolId: number | null;
  schoolName: string;
  staff: PersonOption[];
};

export async function listSchoolStaffBySchoolForMailPicker(): Promise<
  SchoolStaffGroupOption[]
> {
  const rows = await db
    .select({
      personId: people.personId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      schoolId: people.schoolId,
      schoolName: schools.name,
      schoolCode: schools.schoolCode,
    })
    .from(people)
    .leftJoin(schools, eq(people.schoolId, schools.id))
    .where(schoolStaffCondition())
    .orderBy(asc(schools.schoolCode), asc(people.firstName), asc(people.lastName));

  const groupMap = new Map<number | null, SchoolStaffGroupOption>();
  const schoolCodes = new Map<number | null, string>();

  for (const row of rows) {
    const key = row.schoolId;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        schoolId: key,
        schoolName: row.schoolName ?? "ไม่ระบุโรงเรียน",
        staff: [],
      });
      schoolCodes.set(key, row.schoolCode ?? "");
    }

    groupMap.get(key)!.staff.push({
      personId: row.personId,
      label:
        formatPersonName({
          prefix: row.prefix,
          firstName: row.firstName,
          lastName: row.lastName,
          fallback: row.personId,
        }) || row.personId,
    });
  }

  return [...groupMap.entries()]
    .sort(([aId], [bId]) => {
      if (aId == null) return 1;
      if (bId == null) return -1;
      return (schoolCodes.get(aId) ?? "").localeCompare(
        schoolCodes.get(bId) ?? "",
        "th",
      );
    })
    .map(([, group]) => group)
    .filter((group) => group.staff.length > 0);
}

/** legacy: ครูและบุคลากรในสถานศึกษา (ไม่รวมผู้อำนวยการ position_code 1) */
export async function resolveSchoolStaffPersonIds(): Promise<string[]> {
  const rows = await db
    .select({ personId: people.personId })
    .from(people)
    .where(schoolStaffCondition())
    .orderBy(asc(people.personId));

  return rows.map((r) => r.personId);
}

export type PersonOption = {
  personId: string;
  label: string;
};

export async function listActivePeopleForMailPicker(): Promise<PersonOption[]> {
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

export type MailPermissionRow = {
  id: number;
  userId: number;
  personId: string;
  p1: number;
  officerPersonId: string | null;
  displayName: string;
};

export async function listMailPermissions(): Promise<MailPermissionRow[]> {
  const rows = await db
    .select({
      id: mailPermissions.id,
      userId: mailPermissions.userId,
      personId: users.personId,
      p1: mailPermissions.p1,
      officerPersonId: mailPermissions.officerPersonId,
      prefix: people.prefix,
      firstName: people.firstName,
      lastName: people.lastName,
      userName: users.name,
    })
    .from(mailPermissions)
    .innerJoin(users, eq(mailPermissions.userId, users.id))
    .leftJoin(
      people,
      and(eq(people.personId, users.personId), eq(people.status, 0)),
    )
    .orderBy(asc(mailPermissions.id));

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

export async function getMailModulePermission(id: number) {
  const rows = await listMailPermissions();
  return rows.find((r) => r.id === id) ?? null;
}

export async function getMailPermissionByUserId(userId: number) {
  const [row] = await db
    .select({ id: mailPermissions.id })
    .from(mailPermissions)
    .where(eq(mailPermissions.userId, userId))
    .limit(1);
  return row ?? null;
}

export type StaffOption = {
  userId: number;
  personId: string;
  label: string;
};

export async function listStaffForMailPermissionPicker(
  excludeUserId?: number,
): Promise<StaffOption[]> {
  const existing = await db
    .select({ userId: mailPermissions.userId })
    .from(mailPermissions);

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

export function generateMailRefId(senderPersonId: string): string {
  return `${senderPersonId}${Date.now()}`;
}
