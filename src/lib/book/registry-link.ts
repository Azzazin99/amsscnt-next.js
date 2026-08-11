import { insertAndGetId } from "../db/helpers";
import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bookDocuments,
  bookRecipients,
  registerReceives,
  registerSends,
} from "@/lib/db/schema";
import {
  booleanFromSecretLevel,
  normalizeSecretLevel,
  normalizeUrgencyLevel,
} from "@/lib/bookregister/regulation-fields";
import { allocateNextRegisterNumber } from "@/lib/bookregister/receive/queries";
import {
  generateReceiveRefId,
  todayBangkokDateString,
} from "@/lib/bookregister/receive/ref-id";
import type { BookregisterScope } from "@/lib/bookregister/scope";
import { getActiveRegisterYear } from "@/lib/bookregister/years/queries";
import {
  listAllActiveSchoolCodes,
  resolveGroupMemberSchoolCodes,
  resolveSchoolCodesByIds,
} from "@/lib/book/queries";
import type { BookScope } from "@/lib/book/scope";

const DISTRICT_NAME =
  "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาชัยนาท";

function toRegisterScope(scope: BookScope): BookregisterScope {
  if (scope.kind === "district") {
    return { kind: "district", schoolId: null };
  }
  return {
    kind: "school",
    schoolId: scope.schoolId,
    schoolCode: scope.schoolCode,
    schoolName: scope.schoolName,
  };
}

function senderBookFrom(doc: {
  bookType: number;
  officeCode: string;
}): string {
  if (doc.bookType === 1 || doc.bookType === 3 || doc.bookType === 6) {
    return DISTRICT_NAME;
  }
  return doc.officeCode;
}

export async function findRegisterReceiveByBookLink(
  bookDocId: number,
  scope?: BookScope,
): Promise<number | null> {
  const conditions = [
    eq(registerReceives.bookLink, bookDocId),
    isNull(registerReceives.deletedAt),
  ];
  if (scope?.kind === "school") {
    conditions.push(eq(registerReceives.schoolId, scope.schoolId));
  } else if (scope?.kind === "district") {
    conditions.push(isNull(registerReceives.schoolId));
  }

  const [row] = await db
    .select({ id: registerReceives.id })
    .from(registerReceives)
    .where(and(...conditions))
    .limit(1);

  return row?.id ?? null;
}

export async function createRegisterReceiveFromBookAck(input: {
  bookDocId: number;
  scope: BookScope;
  userId: number;
}): Promise<{ ok: true; receiveId: number } | { ok: false; message: string }> {
  const existing = await findRegisterReceiveByBookLink(
    input.bookDocId,
    input.scope,
  );
  if (existing) {
    await db
      .update(bookDocuments)
      .set({ bookRegisLink: existing })
      .where(
        and(
          eq(bookDocuments.id, input.bookDocId),
          eq(bookDocuments.bookRegisLink, 0),
          ne(bookDocuments.bookType, 6),
        ),
      );
    return { ok: true, receiveId: existing };
  }

  const [doc] = await db
    .select({
      id: bookDocuments.id,
      bookNo: bookDocuments.bookNo,
      signDate: bookDocuments.signDate,
      subject: bookDocuments.subject,
      urgencyLevel: bookDocuments.urgencyLevel,
      secretLevel: bookDocuments.secretLevel,
      bookType: bookDocuments.bookType,
      officeCode: bookDocuments.officeCode,
    })
    .from(bookDocuments)
    .where(eq(bookDocuments.id, input.bookDocId))
    .limit(1);

  if (!doc) {
    return { ok: false, message: "ไม่พบหนังสือ" };
  }

  const regScope = toRegisterScope(input.scope);
  const activeYear = await getActiveRegisterYear(regScope);
  if (!activeYear || activeYear.startReceiveNum <= 0) {
    return { ok: false, message: "ทะเบียนรับไม่เปิดใช้งาน" };
  }

  const registerNumber = await allocateNextRegisterNumber(
    regScope,
    activeYear.year,
  );
  const refId = generateReceiveRefId();
  const registerDate = todayBangkokDateString();
  const secretLevel = normalizeSecretLevel(doc.secretLevel);
  const bookTo =
    input.scope.kind === "district"
      ? DISTRICT_NAME
      : input.scope.schoolName;

  const insertedId = await insertAndGetId(registerReceives, {
      schoolId: input.scope.kind === "school" ? input.scope.schoolId : null,
      year: activeYear.year,
      registerNumber,
      bookNo: doc.bookNo,
      signdate: doc.signDate,
      bookFrom: senderBookFrom(doc),
      bookTo,
      subject: doc.subject,
      operation: null,
      comment: "บันทึกอัตโนมัติจากระบบรับส่งหนังสือ",
      registerDate,
      refId,
      officerId: input.userId,
      workgroupId: null,
      recordType: 2,
      bookLink: input.bookDocId,
      source: "book",
      urgencyLevel: normalizeUrgencyLevel(doc.urgencyLevel),
      secretLevel,
      secret: booleanFromSecretLevel(secretLevel),
    });
  const inserted = { id: insertedId };

  if (!inserted) {
    return { ok: false, message: "ไม่สามารถสร้างทะเบียนรับได้" };
  }

  await db
    .update(bookDocuments)
    .set({ bookRegisLink: inserted.id })
    .where(
      and(
        eq(bookDocuments.id, input.bookDocId),
        eq(bookDocuments.bookRegisLink, 0),
        ne(bookDocuments.bookType, 6),
      ),
    );

  return { ok: true, receiveId: inserted.id };
}

async function resolveForwardRecipients(input: {
  recipientMode: "all_schools" | "selected_schools" | "book_group";
  schoolIds?: number[];
  groupId?: number;
}): Promise<{ ok: true; codes: string[] } | { ok: false; message: string }> {
  if (input.recipientMode === "all_schools") {
    return { ok: true, codes: await listAllActiveSchoolCodes() };
  }
  if (input.recipientMode === "selected_schools") {
    const ids = input.schoolIds ?? [];
    if (ids.length === 0) {
      return { ok: false, message: "กรุณาเลือกโรงเรียนผู้รับ" };
    }
    return { ok: true, codes: await resolveSchoolCodesByIds(ids) };
  }
  if (input.recipientMode === "book_group") {
    const groupId = input.groupId;
    if (!groupId) {
      return { ok: false, message: "กรุณาเลือกกลุ่มหนังสือ" };
    }
    const codes = await resolveGroupMemberSchoolCodes(groupId);
    if (codes.length === 0) {
      return { ok: false, message: "กลุ่มหนังสือนี้ไม่มีสมาชิก" };
    }
    return { ok: true, codes };
  }
  return { ok: false, message: "รูปแบบผู้รับไม่ถูกต้อง" };
}

export async function forwardRegisterSendToBook(input: {
  registerSendId: number;
  recipientMode: "all_schools" | "selected_schools" | "book_group";
  schoolIds?: number[];
  groupId?: number;
  user: {
    id: number;
    personId: string;
    officeCode?: string | null;
  };
}): Promise<{ ok: true; bookDocId: number } | { ok: false; message: string }> {
  const [send] = await db
    .select({
      id: registerSends.id,
      bookNo: registerSends.bookNo,
      signdate: registerSends.signdate,
      subject: registerSends.subject,
      comment: registerSends.comment,
      urgencyLevel: registerSends.urgencyLevel,
      secretLevel: registerSends.secretLevel,
      forwardedToSchools: registerSends.forwardedToSchools,
      schoolId: registerSends.schoolId,
    })
    .from(registerSends)
    .where(
      and(
        eq(registerSends.id, input.registerSendId),
        isNull(registerSends.schoolId),
        isNull(registerSends.deletedAt),
      ),
    )
    .limit(1);

  if (!send) {
    return { ok: false, message: "ไม่พบทะเบียนส่ง" };
  }
  if (send.forwardedToSchools) {
    return { ok: false, message: "ส่งต่อโรงเรียนแล้ว" };
  }
  if (!send.bookNo || !send.signdate || !send.subject) {
    return { ok: false, message: "ข้อมูลทะเบียนส่งไม่ครบ" };
  }

  const recipients = await resolveForwardRecipients(input);
  if (!recipients.ok) return recipients;

  const refId = generateReceiveRefId();
  const insertedId = await insertAndGetId(bookDocuments, {
      refId,
      bookType: 6,
      senderPersonId: input.user.personId,
      officeCode: input.user.officeCode?.trim() || "1701",
      senderSchoolId: null,
      senderUserId: input.user.id,
      urgencyLevel: normalizeUrgencyLevel(send.urgencyLevel),
      secretLevel: normalizeSecretLevel(send.secretLevel),
      bookNo: send.bookNo,
      signDate: send.signdate,
      subject: send.subject,
      detail: send.comment,
      bookRegisLink: input.registerSendId,
    });
  const inserted = { id: insertedId };

  if (!inserted) {
    return { ok: false, message: "ไม่สามารถสร้างหนังสือได้" };
  }

  await db.insert(bookRecipients).values(
    recipients.codes.map((code) => ({
      refId,
      sendLevel: 1,
      sendTo: code,
      answered: false,
    })),
  );

  await db
    .update(registerSends)
    .set({ forwardedToSchools: true, updatedAt: new Date() })
    .where(eq(registerSends.id, input.registerSendId));

  return { ok: true, bookDocId: inserted.id };
}
