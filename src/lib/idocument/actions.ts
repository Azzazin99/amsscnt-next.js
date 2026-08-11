"use server";

import { insertAndGetId } from "../db/helpers";

import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canEditIdocumentStatus } from "@/lib/idocument/status";
import {
  allocateNextBookNumber,
  currentBuddhistYear,
  formatBookNo,
  getDocumentById,
  getOfficerProfile,
  todayDocumentDate,
} from "@/lib/idocument/queries";
import { idocumentFormSchema } from "@/lib/idocument/schemas";
import { requireIdocumentWriteAccess } from "@/lib/idocument/scope";
import { db } from "@/lib/db";
import { idocumentMain, idocumentSendto } from "@/lib/db/schema";

const LIST_PATH = "/modules/idocument";

function parseIdocumentForm(formData: FormData) {
  return idocumentFormSchema.safeParse({
    workgroup: formData.get("workgroup"),
    workgroupTxt: formData.get("workgroupTxt"),
    subject: formData.get("subject"),
    bookTo: formData.get("bookTo"),
    content1: formData.get("content1"),
    content2: formData.get("content2"),
    content3: formData.get("content3"),
    bookType: formData.get("bookType"),
    recipientPersonId: formData.get("recipientPersonId"),
  });
}

function recIdForDocument(documentId: number): string {
  return createHash("md5").update(String(documentId)).digest("hex");
}

async function upsertSendto(input: {
  documentId: number;
  recipientPersonId: string;
  officerPersonId: string;
}) {
  const [existing] = await db
    .select({ id: idocumentSendto.id })
    .from(idocumentSendto)
    .where(eq(idocumentSendto.documentId, input.documentId))
    .limit(1);

  const recId = recIdForDocument(input.documentId);

  if (existing) {
    await db
      .update(idocumentSendto)
      .set({
        recId,
        personId: input.recipientPersonId,
        documentFrom: input.officerPersonId,
        status: 1,
      })
      .where(eq(idocumentSendto.id, existing.id));
    return;
  }

  await db.insert(idocumentSendto).values({
    documentId: input.documentId,
    recId,
    personId: input.recipientPersonId,
    documentFrom: input.officerPersonId,
    status: 1,
  });
}

export async function createIdocument(formData: FormData) {
  const { user } = await requireIdocumentWriteAccess();
  const parsed = parseIdocumentForm(formData);

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const officer = await getOfficerProfile(user.personId);
  if (!officer) {
    return { ok: false as const, message: "ไม่พบข้อมูลเจ้าหน้าที่" };
  }

  const bookYear = currentBuddhistYear();
  const bookNumber = await allocateNextBookNumber(bookYear);
  const bookNo = formatBookNo(bookNumber, bookYear);
  const submitMode = formData.get("submitMode") === "submit";

  const insertedId = await insertAndGetId(idocumentMain, {
      workgroup: parsed.data.workgroup,
      workgroupTxt: parsed.data.workgroupTxt,
      bookYear,
      bookNumber,
      bookNo,
      bookDate: todayDocumentDate(),
      subject: parsed.data.subject,
      preDocId: submitMode ? "1" : "0",
      bookTo: parsed.data.bookTo,
      content1: parsed.data.content1,
      content2: parsed.data.content2,
      content3: parsed.data.content3,
      officer: user.personId,
      officerName: officer.name,
      officerPosition: officer.position,
      bookStatus: submitMode ? 1 : 0,
      bookType: parsed.data.bookType,
    });
  const inserted = { id: insertedId };

  if (!inserted) {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  if (submitMode) {
    await upsertSendto({
      documentId: inserted.id,
      recipientPersonId: parsed.data.recipientPersonId,
      officerPersonId: user.personId,
    });
  }

  revalidatePath(LIST_PATH);
  revalidatePath("/modules/idocument/inbox");
  revalidatePath("/modules/idocument/reports");
  redirect(`/modules/idocument/${inserted.id}`);
}

export async function updateIdocument(id: number, formData: FormData) {
  const { user } = await requireIdocumentWriteAccess();
  const existing = await getDocumentById(id);

  if (!existing) {
    return { ok: false as const, message: "ไม่พบเอกสาร" };
  }

  if (existing.officer !== user.personId && !user.isSuperAdmin && !user.isAdmin) {
    return { ok: false as const, message: "ไม่มีสิทธิ์แก้ไขเอกสารนี้" };
  }

  if (!canEditIdocumentStatus(existing.bookStatus)) {
    return { ok: false as const, message: "เอกสารนี้ไม่สามารถแก้ไขได้" };
  }

  const parsed = parseIdocumentForm(formData);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const officer = await getOfficerProfile(user.personId);
  if (!officer) {
    return { ok: false as const, message: "ไม่พบข้อมูลเจ้าหน้าที่" };
  }

  const submitMode = formData.get("submitMode") === "submit";

  await db
    .update(idocumentMain)
    .set({
      workgroup: parsed.data.workgroup,
      workgroupTxt: parsed.data.workgroupTxt,
      subject: parsed.data.subject,
      preDocId: submitMode ? "1" : existing.preDocId === "1" ? "1" : "0",
      bookTo: parsed.data.bookTo,
      content1: parsed.data.content1,
      content2: parsed.data.content2,
      content3: parsed.data.content3,
      officer: user.personId,
      officerName: officer.name,
      officerPosition: officer.position,
      bookStatus: submitMode ? 1 : existing.bookStatus,
      bookType: parsed.data.bookType,
      bookDate: todayDocumentDate(),
    })
    .where(eq(idocumentMain.id, id));

  if (submitMode) {
    await upsertSendto({
      documentId: id,
      recipientPersonId: parsed.data.recipientPersonId,
      officerPersonId: user.personId,
    });
  }

  revalidatePath(LIST_PATH);
  revalidatePath(`/modules/idocument/${id}`);
  revalidatePath(`/modules/idocument/${id}/edit`);
  revalidatePath("/modules/idocument/inbox");
  redirect(`/modules/idocument/${id}`);
}

export async function submitIdocument(id: number, recipientPersonId: string) {
  const { user } = await requireIdocumentWriteAccess();
  const existing = await getDocumentById(id);

  if (!existing) {
    return { ok: false as const, message: "ไม่พบเอกสาร" };
  }

  if (existing.officer !== user.personId && !user.isSuperAdmin && !user.isAdmin) {
    return { ok: false as const, message: "ไม่มีสิทธิ์เสนอเอกสารนี้" };
  }

  if (!canEditIdocumentStatus(existing.bookStatus)) {
    return { ok: false as const, message: "เอกสารนี้ไม่สามารถเสนอได้" };
  }

  if (!/^\d{13}$/.test(recipientPersonId)) {
    return { ok: false as const, message: "กรุณาเลือกผู้รับเสนอ" };
  }

  await db
    .update(idocumentMain)
    .set({
      preDocId: "1",
      bookStatus: 1,
    })
    .where(eq(idocumentMain.id, id));

  await upsertSendto({
    documentId: id,
    recipientPersonId,
    officerPersonId: user.personId,
  });

  revalidatePath(LIST_PATH);
  revalidatePath(`/modules/idocument/${id}`);
  revalidatePath("/modules/idocument/inbox");
  return { ok: true as const };
}
