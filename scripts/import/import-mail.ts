import { db, queryClient } from "../../src/lib/db";
import {
  mailDocuments,
  mailFiles,
  mailGroupMembers,
  mailGroups,
  mailPermissions,
  mailRecipients,
} from "../../src/lib/db/schema";
import {
  flushBatch,
  legacyTableExists,
  type ImportMaps,
  parseLegacyPermissionFlag,
  uniqueRefId,
} from "./shared";

const MAIL_SUBJECT_MAX = 150;

function truncateMailSubject(value: unknown): string {
  const text = String(value ?? "");
  return text.length > MAIL_SUBJECT_MAX
    ? text.slice(0, MAIL_SUBJECT_MAX)
    : text;
}

export async function importMail(maps: ImportMaps) {
  const { userMap } = maps;
  const groupMap = new Map<number, number>();

  if (await legacyTableExists("mail_group")) {
    const groupRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM mail_group ORDER BY grp_id`;
    for (const row of groupRows) {
      const legacyId = Number(row.grp_id);
      const [inserted] = await db
        .insert(mailGroups)
        .values({
          legacyId,
          name: String(row.grp_name ?? ""),
          sortOrder: legacyId,
        })
        .returning({ id: mailGroups.id });
      groupMap.set(legacyId, inserted.id);
    }
  }

  if (await legacyTableExists("mail_group_member")) {
    const memberRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM mail_group_member ORDER BY id`;
    let batch: (typeof mailGroupMembers.$inferInsert)[] = [];
    for (const row of memberRows) {
      const groupId = groupMap.get(Number(row.grp_id));
      const personId = String(row.person_id ?? "");
      if (!groupId || !personId) continue;
      await flushBatch(batch, (rows) => db.insert(mailGroupMembers).values(rows), {
        groupId,
        personId,
      });
    }
    if (batch.length) await db.insert(mailGroupMembers).values(batch);
  }

  if (await legacyTableExists("mail_permission")) {
    const permRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM mail_permission ORDER BY id`;
    const seenUsers = new Set<number>();
    for (const row of permRows) {
      const personId = String(row.person_id ?? "");
      const userId = userMap.get(personId);
      if (!userId || seenUsers.has(userId)) continue;
      seenUsers.add(userId);
      await db.insert(mailPermissions).values({
        userId,
        p1: parseLegacyPermissionFlag(row.p1),
        officerPersonId: row.officer ? String(row.officer) : null,
        recDate: row.rec_date ? String(row.rec_date) : null,
      });
    }
  }

  const validRefIds = new Set<string>();
  const seenRefIds = new Set<string>();
  if (await legacyTableExists("mail_main")) {
    const mainRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM mail_main ORDER BY ms_id`;
    let batch: (typeof mailDocuments.$inferInsert)[] = [];
    for (const row of mainRows) {
      const legacyRefId = String(row.ref_id);
      const refId = uniqueRefId(
        legacyRefId,
        Number(row.ms_id ?? 0),
        seenRefIds,
      );
      const senderPersonId = String(row.sender ?? "");
      validRefIds.add(refId);
      if (refId !== legacyRefId) {
        validRefIds.add(legacyRefId);
      }
      await flushBatch(batch, (rows) => db.insert(mailDocuments).values(rows), {
        refId,
        senderPersonId,
        senderUserId: userMap.get(senderPersonId) ?? null,
        subject: truncateMailSubject(row.subject),
        detail: row.detail ? String(row.detail) : null,
        sendDate: row.send_date ? new Date(String(row.send_date)) : new Date(),
        createdAt: row.send_date ? new Date(String(row.send_date)) : new Date(),
      });
    }
    if (batch.length) await db.insert(mailDocuments).values(batch);
  }

  if (await legacyTableExists("mail_sendto_answer")) {
    const recipientRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM mail_sendto_answer ORDER BY id`;
    let batch: (typeof mailRecipients.$inferInsert)[] = [];
    const seenRecipients = new Set<string>();
    for (const row of recipientRows) {
      const refId = String(row.ref_id ?? "");
      const sendTo = String(row.send_to ?? "");
      if (!refId || !sendTo || !validRefIds.has(refId)) continue;
      const recipientKey = `${refId}\0${sendTo}`;
      if (seenRecipients.has(recipientKey)) continue;
      seenRecipients.add(recipientKey);
      const answered = Number(row.answer ?? 0) !== 0;
      await flushBatch(batch, (rows) => db.insert(mailRecipients).values(rows), {
        refId,
        sendTo,
        answered,
        answeredAt:
          answered && row.answer_time
            ? new Date(String(row.answer_time))
            : null,
      }, 500);
    }
    if (batch.length) await db.insert(mailRecipients).values(batch);
  }

  if (await legacyTableExists("mail_filebook")) {
    const fileRows = await queryClient<
      Record<string, unknown>[]
    >`SELECT * FROM mail_filebook ORDER BY id`;
    let batch: (typeof mailFiles.$inferInsert)[] = [];
    for (const row of fileRows) {
      const refId = String(row.ref_id ?? "");
      const fileName = row.file_name ? String(row.file_name).trim() : "";
      if (!refId || !fileName || !validRefIds.has(refId)) continue;
      await flushBatch(batch, (rows) => db.insert(mailFiles).values(rows), {
        refId,
        fileName,
        fileDes: row.file_des ? String(row.file_des) : null,
      }, 500);
    }
    if (batch.length) await db.insert(mailFiles).values(batch);
  }
}
