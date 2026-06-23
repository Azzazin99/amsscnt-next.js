"use server";

import path from "node:path";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { todayBangkokDateString } from "@/lib/bookregister/receive/ref-id";
import {
  buildStoredCabinetFileName,
  deleteCabinetFileFromStorage,
  isAllowedCabinetFileName,
  saveCabinetFileToStorage,
} from "@/lib/cabinet/files";
import {
  canManageCabinetSettings,
  getCabinetPermissions,
} from "@/lib/cabinet/permissions";
import {
  getCabinetDocument,
  getCabinetModulePermission,
  getCabinetPermissionByUserId,
} from "@/lib/cabinet/queries";
import {
  cabinetDocumentFormSchema,
  cabinetPermissionFormSchema,
} from "@/lib/cabinet/schemas";
import {
  requireCabinetSettingsAccess,
  requireCabinetUploadAccess,
} from "@/lib/cabinet/scope";
import { db } from "@/lib/db";
import { cabinetDocuments, cabinetPermissions } from "@/lib/db/schema";

const LIST_PATH = "/modules/cabinet";
const PERMS_PATH = "/modules/cabinet/permissions";

function parsePermissionForm(formData: FormData) {
  const parsed = cabinetPermissionFormSchema.safeParse({
    userId: formData.get("userId"),
    p1: formData.get("p1"),
    officerPersonId: formData.get("officerPersonId"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  return { ok: true as const, data: parsed.data };
}

export async function uploadCabinetDocument(formData: FormData) {
  const { user } = await requireCabinetUploadAccess();

  const parsed = cabinetDocumentFormSchema.safeParse({
    docSubject: formData.get("docSubject"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return { ok: false as const, message: "กรุณาเลือกไฟล์" };
  }

  if (!isAllowedCabinetFileName(file.name)) {
    return { ok: false as const, message: "ชนิดไฟล์ไม่รองรับ" };
  }

  if (file.size > 20 * 1024 * 1024) {
    return { ok: false as const, message: "ไฟล์ใหญ่เกินไป (เกิน 20MB)" };
  }

  const ext = path.extname(file.name).toLowerCase().slice(1);
  const storedName = buildStoredCabinetFileName(user.personId, file.name);
  const { size } = await saveCabinetFileToStorage(storedName, file);

  const [inserted] = await db
    .insert(cabinetDocuments)
    .values({
      docSubject: parsed.data.docSubject,
      docSize: size,
      docName: storedName,
      docType: ext,
      personId: user.personId,
    })
    .returning({ id: cabinetDocuments.id });

  if (!inserted) {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(LIST_PATH);
  return { ok: true as const, id: inserted.id };
}

export async function deleteCabinetDocument(id: number) {
  const { user } = await requireCabinetUploadAccess();
  const doc = await getCabinetDocument(id);

  if (!doc) {
    return { ok: false as const, message: "ไม่พบเอกสาร" };
  }

  const isOwner = doc.personId === user.personId;
  const perms = await getCabinetPermissions(Number(user.id));
  const isAdmin =
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("cabinet") ||
    perms.p1 === 1;

  if (!isOwner && !isAdmin) {
    return { ok: false as const, message: "ไม่มีสิทธิ์ลบเอกสารนี้" };
  }

  try {
    await deleteCabinetFileFromStorage(doc.docName);
  } catch {
    // file may already be missing
  }

  await db.delete(cabinetDocuments).where(eq(cabinetDocuments.id, id));
  revalidatePath(LIST_PATH);
  return { ok: true as const };
}

async function requireCabinetSettingsAccessFromSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const perms = await getCabinetPermissions(Number(session.user.id));
  if (!canManageCabinetSettings(session.user, perms)) {
    throw new Error("ไม่มีสิทธิ์จัดการตั้งค่าตู้เอกสาร");
  }
  return session.user;
}

export async function createCabinetPermission(formData: FormData) {
  const officer = await requireCabinetSettingsAccessFromSession();
  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return parsed;

  const { userId, p1, officerPersonId } = parsed.data;
  const existing = await getCabinetPermissionByUserId(userId);
  if (existing) {
    return {
      ok: false as const,
      message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว — ใช้แก้ไขแทน",
    };
  }

  await db.insert(cabinetPermissions).values({
    userId,
    p1: p1 ? 1 : 0,
    officerPersonId: officerPersonId ?? officer.personId,
    recDate: todayBangkokDateString(),
  });

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function updateCabinetPermission(id: number, formData: FormData) {
  await requireCabinetSettingsAccessFromSession();
  const row = await getCabinetModulePermission(id);
  if (!row) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return parsed;

  const { userId, p1, officerPersonId } = parsed.data;
  const other = await getCabinetPermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false as const, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว" };
  }

  const session = await auth();
  await db
    .update(cabinetPermissions)
    .set({
      userId,
      p1: p1 ? 1 : 0,
      officerPersonId: officerPersonId ?? session?.user?.personId ?? null,
      recDate: todayBangkokDateString(),
    })
    .where(eq(cabinetPermissions.id, id));

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function deleteCabinetPermission(id: number) {
  await requireCabinetSettingsAccess();
  await db.delete(cabinetPermissions).where(eq(cabinetPermissions.id, id));
  revalidatePath(PERMS_PATH);
  return { ok: true as const };
}
