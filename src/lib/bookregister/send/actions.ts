"use server";

import { insertAndGetId } from "../../db/helpers";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath, revalidateTag as nextRevalidateTag } from "next/cache";
const revalidateTag = nextRevalidateTag as any;
import { db } from "@/lib/db";
import { registerSends } from "@/lib/db/schema";
import { getSchoolOfficeNo } from "@/lib/bookregister/office-no/queries";
import {
  booleanFromSecretLevel,
  buildOutgoingBookNo,
  normalizeOfficeType,
  normalizeSecretLevel,
  normalizeUrgencyLevel,
} from "@/lib/bookregister/regulation-fields";
import {
  canDeleteRegisters,
  canModifyOwnSendRecord,
} from "@/lib/bookregister/permissions";
import {
  generateReceiveRefId,
  todayBangkokDateString,
} from "@/lib/bookregister/receive/ref-id";
import {
  allocateNextSendNumber,
  getDistrictOfficeNo,
  getDistrictSend,
} from "@/lib/bookregister/send/queries";
import { BOOKREGISTER_REPORTS_CACHE_TAG } from "@/lib/bookregister/reports/cached-queries";
import {
  sendCreateSchema,
  sendSchoolCreateSchema,
  sendSchoolUpdateSchema,
  sendUpdateSchema,
  type SendCreateInput,
  type SendUpdateInput,
} from "@/lib/bookregister/send/schemas";
import {
  requireBookregisterScope,
  requireBookregisterWriteScope,
  scopeSendSchoolCondition,
  type BookregisterScope,
} from "@/lib/bookregister/scope";
import { validateOutgoingBookNo } from "@/lib/bookregister/validate-book-no";
import { getActiveRegisterYear } from "@/lib/bookregister/years/queries";

const SEND_PATH = "/modules/bookregister/send";

async function requireActiveSendYear(scope: BookregisterScope) {
  const activeYear = await getActiveRegisterYear(scope);
  if (!activeYear || activeYear.startSendNum <= 0) {
    return { ok: false as const, message: "ทะเบียนส่งไม่เปิดใช้งาน" };
  }
  return { ok: true as const, activeYear };
}

async function resolveOfficeNo(scope: BookregisterScope): Promise<string> {
  if (scope.kind === "school") {
    return (await getSchoolOfficeNo(scope.schoolCode)).trim();
  }
  return (await getDistrictOfficeNo()).trim();
}

function regulationFields(data: {
  urgencyLevel: number;
  secretLevel: number;
}) {
  const secretLevel = normalizeSecretLevel(data.secretLevel);
  return {
    urgencyLevel: normalizeUrgencyLevel(data.urgencyLevel),
    secretLevel,
    secret: booleanFromSecretLevel(secretLevel),
  };
}

function parseSendCreate(formData: FormData, scope: BookregisterScope) {
  const schema =
    scope.kind === "school" ? sendSchoolCreateSchema : sendCreateSchema;
  const parsed = schema.safeParse({
    bookFrom: formData.get("bookFrom"),
    bookTo: formData.get("bookTo"),
    signdate: formData.get("signdate"),
    subject: formData.get("subject"),
    workgroupId: formData.get("workgroupId") || undefined,
    operation: formData.get("operation") || undefined,
    comment: formData.get("comment") || undefined,
    officeType: formData.get("officeType") ?? "1",
    urgencyLevel: formData.get("urgencyLevel") ?? "1",
    secretLevel: formData.get("secretLevel") ?? "0",
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }
  return { ok: true as const, data: parsed.data };
}

function parseSendUpdate(formData: FormData, scope: BookregisterScope) {
  const schema =
    scope.kind === "school" ? sendSchoolUpdateSchema : sendUpdateSchema;
  const parsed = schema.safeParse({
    bookNo: formData.get("bookNo"),
    bookFrom: formData.get("bookFrom"),
    bookTo: formData.get("bookTo"),
    signdate: formData.get("signdate"),
    subject: formData.get("subject"),
    workgroupId: formData.get("workgroupId") || undefined,
    operation: formData.get("operation") || undefined,
    comment: formData.get("comment") || undefined,
    officeType: formData.get("officeType") || undefined,
    urgencyLevel: formData.get("urgencyLevel") ?? "1",
    secretLevel: formData.get("secretLevel") ?? "0",
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }
  return { ok: true as const, data: parsed.data };
}

export async function createDistrictSend(formData: FormData) {
  const { user, scope } = await requireBookregisterWriteScope();
  const yearCheck = await requireActiveSendYear(scope);
  if (!yearCheck.ok) return { ok: false, message: yearCheck.message };

  const parsed = parseSendCreate(formData, scope);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { activeYear } = yearCheck;
  const officeNo = await resolveOfficeNo(scope);
  if (!officeNo) {
    return {
      ok: false,
      message:
        scope.kind === "school"
          ? "ยังไม่ได้กำหนดเลขที่หนังสือโรงเรียน"
          : "ยังไม่ได้กำหนดเลขที่สำนักงาน — ไปที่กำหนดเลขที่หนังสือ",
    };
  }

  const registerNumber = await allocateNextSendNumber(scope, activeYear.year);
  const officeType = normalizeOfficeType(parsed.data.officeType);
  const bookNo = buildOutgoingBookNo(officeNo, officeType, registerNumber);
  const bookNoError = validateOutgoingBookNo(bookNo, officeNo);
  if (bookNoError) {
    return { ok: false, message: bookNoError };
  }

  const refId = generateReceiveRefId();
  const registerDate = todayBangkokDateString();
  const reg = regulationFields(parsed.data);
  const workgroupId =
    scope.kind === "school"
      ? null
      : (parsed.data as SendCreateInput).workgroupId;

  let insertedId: number;
  try {
    insertedId = await insertAndGetId(registerSends, {
      schoolId: scope.kind === "school" ? scope.schoolId : null,
      year: activeYear.year,
      registerNumber,
      bookNo,
      signdate: parsed.data.signdate,
      bookFrom: parsed.data.bookFrom.trim(),
      bookTo: parsed.data.bookTo.trim(),
      subject: parsed.data.subject.trim(),
      operation: parsed.data.operation?.trim() || null,
      comment: parsed.data.comment?.trim() || null,
      registerDate,
      refId,
      officerId: Number(user.id),
      workgroupId,
      officeType,
      forwardedToSchools: false,
      ...reg,
    });
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกได้ — กรุณาลองใหม่" };
  }

  revalidatePath(SEND_PATH);
  revalidatePath(`${SEND_PATH}/${insertedId}/edit`);
  revalidateTag(BOOKREGISTER_REPORTS_CACHE_TAG);
  return { ok: true as const, id: insertedId };
}

export async function updateDistrictSend(id: number, formData: FormData) {
  const { user, perms, scope } = await requireBookregisterWriteScope();
  const existing = await getDistrictSend(id, scope);
  if (!existing) return { ok: false, message: "ไม่พบรายการ" };

  if (
    !canModifyOwnSendRecord(
      user,
      perms,
      existing.officerId,
      existing.registerDate,
    )
  ) {
    return {
      ok: false,
      message: "ไม่มีสิทธิ์แก้ไขรายการนี้ (หมดเวลาแก้ไขหรือไม่ใช่ผู้บันทึก)",
    };
  }

  const officeNo = await resolveOfficeNo(scope);
  const parsed = parseSendUpdate(formData, scope);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const bookNoError = validateOutgoingBookNo(parsed.data.bookNo, officeNo);
  if (bookNoError) {
    return { ok: false, message: bookNoError };
  }

  const reg = regulationFields(parsed.data);
  const officeType =
    parsed.data.officeType != null
      ? normalizeOfficeType(parsed.data.officeType)
      : existing.officeType;
  const workgroupId =
    scope.kind === "school"
      ? null
      : (parsed.data as SendUpdateInput).workgroupId ?? existing.workgroupId;

  try {
    await db
      .update(registerSends)
      .set({
        bookNo: parsed.data.bookNo.trim(),
        signdate: parsed.data.signdate,
        bookFrom: parsed.data.bookFrom.trim(),
        bookTo: parsed.data.bookTo.trim(),
        subject: parsed.data.subject.trim(),
        operation: parsed.data.operation?.trim() || null,
        comment: parsed.data.comment?.trim() || null,
        workgroupId,
        officeType,
        ...reg,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(registerSends.id, id),
          scopeSendSchoolCondition(scope),
          isNull(registerSends.deletedAt),
        ),
      );
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(SEND_PATH);
  revalidatePath(`${SEND_PATH}/${id}/edit`);
  revalidateTag(BOOKREGISTER_REPORTS_CACHE_TAG);
  return { ok: true as const };
}

export async function deleteDistrictSend(id: number) {
  const { user, perms, scope } = await requireBookregisterScope();
  if (!canDeleteRegisters(user, perms, scope)) {
    throw new Error("ไม่มีสิทธิ์ลบทะเบียนส่ง");
  }

  const existing = await getDistrictSend(id, scope);
  if (!existing) return { ok: false, message: "ไม่พบรายการ" };

  if (
    !canModifyOwnSendRecord(
      user,
      perms,
      existing.officerId,
      existing.registerDate,
    )
  ) {
    return {
      ok: false,
      message: "ไม่มีสิทธิ์ลบรายการนี้ (หมดเวลาลบหรือไม่ใช่ผู้บันทึก)",
    };
  }

  await db
    .update(registerSends)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(registerSends.id, id),
        scopeSendSchoolCondition(scope),
        isNull(registerSends.deletedAt),
      ),
    );

  revalidatePath(SEND_PATH);
  revalidateTag(BOOKREGISTER_REPORTS_CACHE_TAG);
  return { ok: true as const };
}
