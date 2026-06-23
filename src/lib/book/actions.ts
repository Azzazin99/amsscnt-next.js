"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { bookDocuments, bookRecipients } from "@/lib/db/schema";
import {
  normalizeSecretLevel,
  normalizeUrgencyLevel,
} from "@/lib/bookregister/regulation-fields";
import { generateReceiveRefId } from "@/lib/bookregister/receive/ref-id";
import { createRegisterReceiveFromBookAck } from "@/lib/book/registry-link";
import { bookCreateSchema } from "@/lib/book/schemas";
import {
  listAllActiveSchoolCodes,
  resolveGroupMemberSchoolCodes,
  resolveSchoolCodesByIds,
} from "@/lib/book/queries";
import {
  inboxSendTo,
  requireBookScope,
  requireBookWriteAccess,
  type BookScope,
} from "@/lib/book/scope";

const INBOX_PATH = "/modules/book/inbox";
const SENT_PATH = "/modules/book/sent";

function parseCreateForm(formData: FormData, scope: BookScope) {
  const schoolIds = formData
    .getAll("schoolIds")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);

  const allowedModes =
    scope.kind === "school"
      ? (["saraban", "all_schools", "selected_schools", "book_group"] as const)
      : (["all_schools", "selected_schools", "book_group"] as const);

  const parsed = bookCreateSchema.safeParse({
    bookNo: formData.get("bookNo"),
    signDate: formData.get("signDate"),
    subject: formData.get("subject"),
    detail: formData.get("detail") || undefined,
    urgencyLevel: formData.get("urgencyLevel") ?? "1",
    secretLevel: formData.get("secretLevel") ?? "0",
    recipientMode: formData.get("recipientMode"),
    groupId: formData.get("groupId") || undefined,
    schoolIds,
    isCirculation: formData.get("isCirculation") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  if (
    !(allowedModes as readonly string[]).includes(parsed.data.recipientMode)
  ) {
    return { ok: false as const, message: "รูปแบบผู้รับไม่ถูกต้อง" };
  }

  return { ok: true as const, data: parsed.data };
}

async function resolveRecipientCodes(
  data: {
    recipientMode: string;
    groupId?: number;
    schoolIds?: number[];
  },
  scope: BookScope,
): Promise<{ ok: true; codes: string[] } | { ok: false; message: string }> {
  if (data.recipientMode === "saraban") {
    return { ok: true, codes: ["saraban"] };
  }
  if (data.recipientMode === "all_schools") {
    return { ok: true, codes: await listAllActiveSchoolCodes() };
  }
  if (data.recipientMode === "selected_schools") {
    const ids = data.schoolIds ?? [];
    if (ids.length === 0) {
      return { ok: false, message: "กรุณาเลือกโรงเรียนผู้รับ" };
    }
    return { ok: true, codes: await resolveSchoolCodesByIds(ids) };
  }
  if (data.recipientMode === "book_group") {
    const groupId = data.groupId;
    if (!groupId) {
      return { ok: false, message: "กรุณาเลือกกลุ่มหนังสือ" };
    }
    const codes = await resolveGroupMemberSchoolCodes(groupId);
    if (codes.length === 0) {
      return { ok: false, message: "กลุ่มหนังสือนี้ไม่มีสมาชิก" };
    }
    return { ok: true, codes };
  }

  if (scope.kind === "school") {
    return { ok: true, codes: ["saraban"] };
  }

  return { ok: false, message: "รูปแบบผู้รับไม่ถูกต้อง" };
}

export async function createBookDocument(formData: FormData) {
  const { user, scope } = await requireBookWriteAccess();

  const parsed = parseCreateForm(formData, scope);
  if (!parsed.ok) return parsed;

  const recipients = await resolveRecipientCodes(parsed.data, scope);
  if (!recipients.ok) return recipients;

  const secretLevel = normalizeSecretLevel(parsed.data.secretLevel);
  const refId = generateReceiveRefId();
  const bookType = parsed.data.isCirculation
    ? 3
    : scope.kind === "district"
      ? 1
      : 2;
  const officeCode =
    scope.kind === "school" ? scope.schoolCode : user.officeCode ?? "1701";

  const [inserted] = await db
    .insert(bookDocuments)
    .values({
      refId,
      bookType,
      senderPersonId: user.personId,
      officeCode,
      senderSchoolId: scope.kind === "school" ? scope.schoolId : null,
      senderUserId: Number(user.id),
      urgencyLevel: normalizeUrgencyLevel(parsed.data.urgencyLevel),
      secretLevel,
      bookNo: parsed.data.bookNo,
      signDate: parsed.data.signDate,
      subject: parsed.data.subject,
      detail: parsed.data.detail ?? null,
    })
    .returning({ id: bookDocuments.id });

  if (!inserted) {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  await db.insert(bookRecipients).values(
    recipients.codes.map((code) => ({
      refId,
      sendLevel: code === "saraban" ? null : 1,
      sendTo: code,
      answered: false,
    })),
  );

  revalidatePath(INBOX_PATH);
  revalidatePath(SENT_PATH);
  return { ok: true as const, id: inserted.id };
}

export async function acknowledgeBookDocument(formData: FormData) {
  const documentId = Number(formData.get("documentId"));
  if (!Number.isFinite(documentId)) {
    return { ok: false as const, message: "ไม่พบหนังสือ" };
  }

  const autoRegister =
    formData.get("autoRegister") === "true" ||
    formData.get("autoRegister") === "on";

  const { user, scope } = await requireBookScope();
  const sendTo = inboxSendTo(scope);

  const [doc] = await db
    .select({ refId: bookDocuments.refId })
    .from(bookDocuments)
    .where(eq(bookDocuments.id, documentId))
    .limit(1);

  if (!doc) {
    return { ok: false as const, message: "ไม่พบหนังสือ" };
  }

  const [updated] = await db
    .update(bookRecipients)
    .set({ answered: true, answeredAt: new Date() })
    .where(
      and(
        eq(bookRecipients.refId, doc.refId),
        eq(bookRecipients.sendTo, sendTo),
        eq(bookRecipients.answered, false),
      ),
    )
    .returning({ id: bookRecipients.id });

  if (!updated) {
    return { ok: false as const, message: "ตอบรับแล้วหรือไม่มีสิทธิ์" };
  }

  if (autoRegister) {
    const regResult = await createRegisterReceiveFromBookAck({
      bookDocId: documentId,
      scope,
      userId: Number(user.id),
    });
    if (!regResult.ok) {
      return regResult;
    }
    revalidatePath("/modules/bookregister/receive");
    revalidatePath(`/modules/bookregister/receive/${regResult.receiveId}`);
  }

  revalidatePath(INBOX_PATH);
  revalidatePath(`/modules/book/${documentId}`);
  return { ok: true as const };
}
