import { db, queryClient } from "../../src/lib/db";
import {
  bookDocuments,
  bookFiles,
  bookGroupMembers,
  bookGroups,
  bookPermissions,
  bookRecipients,
  people,
} from "../../src/lib/db/schema";
import {
  flushBatch,
  legacyTableExists,
  type ImportMaps,
  parseLegacyPermissionFlag,
  uniqueRefId,
} from "./shared";

const BOOK_SUBJECT_MAX = 500;

function truncateBookSubject(value: unknown): string {
  const text = String(value ?? "");
  return text.length > BOOK_SUBJECT_MAX
    ? text.slice(0, BOOK_SUBJECT_MAX)
    : text;
}

export async function importBook(maps: ImportMaps) {
  const { schoolMap, userMap } = maps;
  const groupMap = new Map<number, number>();
  const seenRefIds = new Set<string>();

  const personWorkgroups = new Map<string, number | null>();
  const personRows = await db
    .select({
      personId: people.personId,
      workgroupId: people.workgroupId,
    })
    .from(people);
  for (const row of personRows) {
    personWorkgroups.set(row.personId, row.workgroupId);
  }

  if (await legacyTableExists("book_group")) {
    const groupRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM book_group ORDER BY grp_id`;
    for (const row of groupRows) {
      const legacyId = Number(row.grp_id);
      const [inserted] = await db
        .insert(bookGroups)
        .values({
          legacyId,
          name: String(row.grp_name ?? ""),
          sortOrder: legacyId,
        })
        .returning({ id: bookGroups.id });
      groupMap.set(legacyId, inserted.id);
    }
  }

  if (await legacyTableExists("book_group_member")) {
    const memberRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM book_group_member ORDER BY id`;
    let batch: (typeof bookGroupMembers.$inferInsert)[] = [];
    for (const row of memberRows) {
      const groupId = groupMap.get(Number(row.grp_id));
      const schoolCode = String(row.school_id ?? "");
      const schoolId = schoolMap.get(schoolCode);
      if (!groupId || !schoolId) continue;
      await flushBatch(batch, (rows) => db.insert(bookGroupMembers).values(rows), {
        groupId,
        schoolId,
      });
    }
    if (batch.length) await db.insert(bookGroupMembers).values(batch);
  }

  if (await legacyTableExists("book_permission")) {
    const permRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM book_permission ORDER BY id`;
    const seenUsers = new Set<number>();
    for (const row of permRows) {
      const personId = String(row.person_id ?? "");
      const userId = userMap.get(personId);
      if (!userId || seenUsers.has(userId)) continue;
      seenUsers.add(userId);
      await db.insert(bookPermissions).values({
        userId,
        p1: parseLegacyPermissionFlag(row.p1),
        p2: parseLegacyPermissionFlag(row.p2),
        p3: parseLegacyPermissionFlag(row.p3),
        canViewSecret: false,
      });
    }
  }

  const validRefIds = new Set<string>();
  if (await legacyTableExists("book_main")) {
    const mainRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM book_main ORDER BY ms_id`;
    let batch: (typeof bookDocuments.$inferInsert)[] = [];
    for (const row of mainRows) {
      const bookType = Number(row.book_type ?? 1);
      const office = String(row.office ?? "");
      const senderPersonId = String(row.sender ?? "");
      const refId = uniqueRefId(
        String(row.ref_id),
        Number(row.ms_id ?? 0),
        seenRefIds,
      );
      validRefIds.add(refId);

      let senderSchoolId: number | null = null;
      if (bookType === 2) {
        senderSchoolId = schoolMap.get(office) ?? null;
      }

      await flushBatch(batch, (rows) => db.insert(bookDocuments).values(rows), {
        refId,
        bookType,
        senderPersonId,
        officeCode: office,
        senderSchoolId,
        senderWorkgroupId: personWorkgroups.get(senderPersonId) ?? null,
        senderUserId: userMap.get(senderPersonId) ?? null,
        urgencyLevel: Number(row.level ?? 1),
        secretLevel: Number(row.secret ?? 0),
        bookNo: String(row.bookno ?? ""),
        signDate: String(row.signdate ?? "1970-01-01"),
        subject: truncateBookSubject(row.subject),
        detail: row.detail ? String(row.detail) : null,
        sendDate: row.send_date ? new Date(String(row.send_date)) : new Date(),
        bookRegisLink: Number(row.bookregis_link ?? 0),
        createdAt: row.send_date ? new Date(String(row.send_date)) : new Date(),
      });
    }
    if (batch.length) await db.insert(bookDocuments).values(batch);
  }

  if (await legacyTableExists("book_sendto_answer")) {
    const recipientRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM book_sendto_answer ORDER BY id`;
    let batch: (typeof bookRecipients.$inferInsert)[] = [];
    for (const row of recipientRows) {
      const refId = String(row.ref_id ?? "");
      const sendTo = String(row.send_to ?? "");
      if (!refId || !sendTo || !validRefIds.has(refId)) continue;
      const answered = Number(row.answer ?? 0) !== 0;
      await flushBatch(batch, (rows) => db.insert(bookRecipients).values(rows), {
        refId,
        sendLevel: row.send_level != null ? Number(row.send_level) : null,
        sendTo,
        schoolScope: row.school ? String(row.school) : null,
        status: row.status != null ? Number(row.status) : null,
        answered,
        answeredAt:
          answered && row.answer_time
            ? new Date(String(row.answer_time))
            : null,
        forwardFrom: row.forward_from ? String(row.forward_from) : null,
        forwardReceivedAt: row.rec_forward_date
          ? new Date(String(row.rec_forward_date))
          : null,
      }, 500);
    }
    if (batch.length) await db.insert(bookRecipients).values(batch);
  }

  if (await legacyTableExists("book_filebook")) {
    const fileRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM book_filebook ORDER BY id`;
    let batch: (typeof bookFiles.$inferInsert)[] = [];
    for (const row of fileRows) {
      const refId = String(row.ref_id ?? "");
      const fileName = row.file_name ? String(row.file_name).trim() : "";
      if (!refId || !fileName || !validRefIds.has(refId)) continue;
      await flushBatch(batch, (rows) => db.insert(bookFiles).values(rows), {
        refId,
        fileName,
        fileDes: row.file_des ? String(row.file_des) : null,
      }, 500);
    }
    if (batch.length) await db.insert(bookFiles).values(batch);
  }
}
