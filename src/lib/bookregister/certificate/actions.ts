"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { registerCertificates } from "@/lib/db/schema";
import {
  booleanFromSecretLevel,
  normalizeSecretLevel,
  normalizeUrgencyLevel,
} from "@/lib/bookregister/regulation-fields";
import {
  canAccessSecretLevel,
  canDeleteCommandRecord,
  canDeleteDistrictRegisters,
  canEditCommandRecord,
  canViewDistrictRegisters,
  canWriteDistrictRegisters,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { allocateNextCertificateNumber, getDistrictCertificate } from "@/lib/bookregister/certificate/queries";
import {
  certificateCreateSchema,
  certificateUpdateSchema,
} from "@/lib/bookregister/certificate/schemas";
import { generateReceiveRefId, todayBangkokDateString } from "@/lib/bookregister/receive/ref-id";
import {
  buildStoredCertificateFileName,
  deleteCertificateFileFromStorage,
  isAllowedCertificateFileName,
  saveCertificateFileToStorage,
} from "@/lib/bookregister/certificate/files";
import { getActiveDistrictYear } from "@/lib/bookregister/years/queries";

const CERTIFICATE_PATH = "/modules/bookregister/certificate";

async function requireCertificateAccess() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canViewDistrictRegisters(session.user, perms)) {
    redirect("/modules/bookregister");
  }

  return { user: session.user, perms };
}

async function requireWriteAccess() {
  const ctx = await requireCertificateAccess();
  if (!canWriteDistrictRegisters(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์บันทึกทะเบียนเกียรติบัตร");
  }
  return ctx;
}

async function requireDeleteAccess() {
  const ctx = await requireCertificateAccess();
  if (!canDeleteDistrictRegisters(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์ลบทะเบียนเกียรติบัตร");
  }
  return ctx;
}

async function requireActiveCertificateYear() {
  const activeYear = await getActiveDistrictYear();
  if (!activeYear || activeYear.startCertificateNum <= 0) {
    return { ok: false as const, message: "ทะเบียนเกียรติบัตรไม่เปิดใช้งาน" };
  }
  return { ok: true as const, activeYear };
}

function readBool(formData: FormData, name: string) {
  const value = formData.get(name);
  return value === "1" || value === "on" || value === "true";
}

async function handleCertificateFileUpload(
  refId: string,
  formData: FormData,
  existingFileName: string | null,
) {
  const file = formData.get("attachment");
  const removeFile = readBool(formData, "removeAttachment");

  if (removeFile && existingFileName) {
    try {
      await deleteCertificateFileFromStorage(existingFileName);
    } catch {
      // ignore missing file on disk
    }
    return { fileName: null as string | null };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { fileName: existingFileName };
  }

  if (!isAllowedCertificateFileName(file.name)) {
    throw new Error("นามสกุลไฟล์ไม่รองรับ");
  }

  const storedName = buildStoredCertificateFileName(refId, file.name);

  if (existingFileName && existingFileName !== storedName) {
    try {
      await deleteCertificateFileFromStorage(existingFileName);
    } catch {
      // ignore
    }
  }

  await saveCertificateFileToStorage(storedName, file);
  return { fileName: storedName };
}

function regulationFields(data: {
  urgencyLevel: number;
  secretLevel: number;
}) {
  const urgencyLevel = normalizeUrgencyLevel(data.urgencyLevel);
  const secretLevel = normalizeSecretLevel(data.secretLevel);

  return {
    urgencyLevel,
    secretLevel,
    secret: booleanFromSecretLevel(secretLevel),
  };
}

export async function createDistrictCertificate(formData: FormData) {
  const { user, perms } = await requireWriteAccess();
  const yearCheck = await requireActiveCertificateYear();
  if (!yearCheck.ok) return { ok: false as const, message: yearCheck.message };

  const parsed = certificateCreateSchema.safeParse({
    signdate: formData.get("signdate"),
    subject: formData.get("subject"),
    comment: formData.get("comment") || undefined,
    urgencyLevel: formData.get("urgencyLevel") ?? "1",
    secretLevel: formData.get("secretLevel") ?? "0",
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const reg = regulationFields(parsed.data);
  if (!canAccessSecretLevel(user, perms, reg.secretLevel)) {
    return {
      ok: false as const,
      message: "ไม่มีสิทธิ์บันทึกทะเบียนหนังสือลับ",
    };
  }

  const registerNumber = await allocateNextCertificateNumber(yearCheck.activeYear.year);
  const refId = generateReceiveRefId();
  const registerDate = todayBangkokDateString();
  const bookNo = `${registerNumber}/${yearCheck.activeYear.year}`;

  let fileName: string | null = null;
  try {
    const fileResult = await handleCertificateFileUpload(
      refId,
      formData,
      null,
    );
    fileName = fileResult.fileName;
  } catch (err) {
    return {
      ok: false as const,
      message: err instanceof Error ? err.message : "อัปโหลดไฟล์ไม่สำเร็จ",
    };
  }

  let insertedId: number | null = null;
  try {
    const [inserted] = await db
      .insert(registerCertificates)
      .values({
        schoolId: null,
        year: yearCheck.activeYear.year,
        registerNumber,
        bookNo,
        signdate: parsed.data.signdate,
        subject: parsed.data.subject.trim(),
        comment: parsed.data.comment?.trim() || null,
        registerDate,
        refId,
        officerId: Number(user.id),
        urgencyLevel: reg.urgencyLevel,
        secretLevel: reg.secretLevel,
        secret: reg.secret,
        fileName,
      })
      .returning({ id: registerCertificates.id });

    insertedId = inserted?.id ?? null;
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้ — กรุณาลองใหม่" };
  }

  if (!insertedId) {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้ — กรุณาลองใหม่" };
  }

  revalidatePath(CERTIFICATE_PATH);
  revalidatePath(`${CERTIFICATE_PATH}/${insertedId}`);
  revalidatePath(`${CERTIFICATE_PATH}/${insertedId}/edit`);

  return { ok: true as const, id: insertedId };
}

export async function updateDistrictCertificate(
  id: number,
  formData: FormData,
) {
  const { user, perms } = await requireWriteAccess();
  const existing = await getDistrictCertificate(id);
  if (!existing) return { ok: false as const, message: "ไม่พบรายการ" };

  if (
    !canEditCommandRecord(
      user,
      perms,
      existing.officerId,
      existing.registerDate,
    )
  ) {
    return {
      ok: false as const,
      message: "ไม่มีสิทธิ์แก้ไขรายการนี้ (หมดเวลาแก้ไขหรือไม่ใช่ผู้บันทึก)",
    };
  }

  const parsed = certificateUpdateSchema.safeParse({
    signdate: formData.get("signdate"),
    subject: formData.get("subject"),
    comment: formData.get("comment") || undefined,
    urgencyLevel: formData.get("urgencyLevel") ?? "1",
    secretLevel: formData.get("secretLevel") ?? "0",
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const reg = regulationFields(parsed.data);
  if (!canAccessSecretLevel(user, perms, reg.secretLevel)) {
    return {
      ok: false as const,
      message: "ไม่มีสิทธิ์บันทึกทะเบียนหนังสือลับ",
    };
  }

  let fileName = existing.fileName;
  try {
    const fileResult = await handleCertificateFileUpload(
      existing.refId,
      formData,
      existing.fileName,
    );
    fileName = fileResult.fileName;
  } catch (err) {
    return {
      ok: false as const,
      message: err instanceof Error ? err.message : "อัปโหลดไฟล์ไม่สำเร็จ",
    };
  }

  try {
    await db
      .update(registerCertificates)
      .set({
        signdate: parsed.data.signdate,
        subject: parsed.data.subject.trim(),
        comment: parsed.data.comment?.trim() || null,
        urgencyLevel: reg.urgencyLevel,
        secretLevel: reg.secretLevel,
        secret: reg.secret,
        fileName,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(registerCertificates.id, id),
          isNull(registerCertificates.schoolId),
          isNull(registerCertificates.deletedAt),
        ),
      );
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(CERTIFICATE_PATH);
  revalidatePath(`${CERTIFICATE_PATH}/${id}`);
  revalidatePath(`${CERTIFICATE_PATH}/${id}/edit`);
  return { ok: true as const };
}

export async function deleteDistrictCertificate(id: number) {
  const { user, perms } = await requireDeleteAccess();
  const existing = await getDistrictCertificate(id);
  if (!existing) return { ok: false as const, message: "ไม่พบรายการ" };

  if (
    !canDeleteCommandRecord(
      user,
      perms,
      existing.officerId,
      existing.registerDate,
    )
  ) {
    return {
      ok: false as const,
      message: "ไม่มีสิทธิ์ลบรายการนี้ (หมดเวลาลบหรือไม่ใช่ผู้บันทึก)",
    };
  }

  if (existing.fileName) {
    try {
      await deleteCertificateFileFromStorage(existing.fileName);
    } catch {
      // ignore
    }
  }

  await db
    .update(registerCertificates)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(registerCertificates.id, id),
        isNull(registerCertificates.schoolId),
        isNull(registerCertificates.deletedAt),
      ),
    );

  revalidatePath(CERTIFICATE_PATH);
  return { ok: true as const };
}

