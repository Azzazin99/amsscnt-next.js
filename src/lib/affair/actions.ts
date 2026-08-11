"use server";

import { insertAndGetId } from "../db/helpers";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { todayBangkokDateString } from "@/lib/bookregister/receive/ref-id";
import { canManageAffairSettings } from "@/lib/affair/permissions";
import {
  getAffairModulePermission,
  getAffairPermissionByUserId,
} from "@/lib/affair/queries";
import {
  affairFormSchema,
  affairPermissionFormSchema,
} from "@/lib/affair/schemas";
import {
  requireAffairSettingsAccess,
  requireAffairWriteAccess,
} from "@/lib/affair/scope";
import { db } from "@/lib/db";
import { affairEntries, affairPermissions } from "@/lib/db/schema";

const LIST_PATH = "/modules/affair";
const PERMS_PATH = "/modules/affair/permissions";

function parseAffairForm(formData: FormData) {
  return affairFormSchema.safeParse({
    affairDate: formData.get("affairDate"),
    affairTime: formData.get("affairTime"),
    subject: formData.get("subject"),
    location: formData.get("location"),
    operationPersonId: formData.get("operationPersonId"),
    remark: formData.get("remark") || undefined,
  });
}

function parsePermissionForm(formData: FormData) {
  const parsed = affairPermissionFormSchema.safeParse({
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

export async function createAffairEntry(formData: FormData) {
  const { user } = await requireAffairWriteAccess();
  const parsed = parseAffairForm(formData);

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const insertedId = await insertAndGetId(affairEntries, {
      affairDate: parsed.data.affairDate,
      affairTime: parsed.data.affairTime,
      subject: parsed.data.subject,
      location: parsed.data.location,
      operationPersonId: parsed.data.operationPersonId,
      remark: parsed.data.remark,
      recDate: todayBangkokDateString(),
      officerPersonId: user.personId,
    });
  const inserted = { id: insertedId };

  if (!inserted) {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(LIST_PATH);
  return { ok: true as const, id: inserted.id };
}

export async function updateAffairEntry(id: number, formData: FormData) {
  const { user } = await requireAffairWriteAccess();
  const parsed = parseAffairForm(formData);

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  await db
    .update(affairEntries)
    .set({
      affairDate: parsed.data.affairDate,
      affairTime: parsed.data.affairTime,
      subject: parsed.data.subject,
      location: parsed.data.location,
      operationPersonId: parsed.data.operationPersonId,
      remark: parsed.data.remark,
      recDate: todayBangkokDateString(),
      officerPersonId: user.personId,
    })
    .where(eq(affairEntries.id, id));

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}/edit`);
  return { ok: true as const };
}

export async function deleteAffairEntry(id: number) {
  await requireAffairWriteAccess();
  await db.delete(affairEntries).where(eq(affairEntries.id, id));
  revalidatePath(LIST_PATH);
  return { ok: true as const };
}

async function requireAffairSettingsAccessFromSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canManageAffairSettings(session.user)) {
    throw new Error("ไม่มีสิทธิ์จัดการตั้งค่าภารกิจผู้อำนวยการ");
  }
  return session.user;
}

export async function createAffairPermission(formData: FormData) {
  const officer = await requireAffairSettingsAccessFromSession();
  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return parsed;

  const { userId, p1, officerPersonId } = parsed.data;
  const existing = await getAffairPermissionByUserId(userId);
  if (existing) {
    return {
      ok: false as const,
      message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว — ใช้แก้ไขแทน",
    };
  }

  await db.insert(affairPermissions).values({
    userId,
    p1: p1 ? 1 : 0,
    officerPersonId: officerPersonId ?? officer.personId,
    recDate: todayBangkokDateString(),
  });

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function updateAffairPermission(id: number, formData: FormData) {
  await requireAffairSettingsAccessFromSession();
  const row = await getAffairModulePermission(id);
  if (!row) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return parsed;

  const { userId, p1, officerPersonId } = parsed.data;
  const other = await getAffairPermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false as const, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว" };
  }

  const session = await auth();
  await db
    .update(affairPermissions)
    .set({
      userId,
      p1: p1 ? 1 : 0,
      officerPersonId: officerPersonId ?? session?.user?.personId ?? null,
      recDate: todayBangkokDateString(),
    })
    .where(eq(affairPermissions.id, id));

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function deleteAffairPermission(id: number) {
  await requireAffairSettingsAccess();
  await db.delete(affairPermissions).where(eq(affairPermissions.id, id));
  revalidatePath(PERMS_PATH);
  return { ok: true as const };
}
