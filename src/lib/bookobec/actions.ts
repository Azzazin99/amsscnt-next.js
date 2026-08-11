"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canManageBookobecStaffPermissions,
  isBookobecModuleAdmin,
} from "@/lib/bookobec/permissions";
import {
  fetchObecPendingFeed,
} from "@/lib/bookobec/obec-client";
import { registerObecPendingItems } from "@/lib/bookobec/receive-register";
import {
  getBookobecModulePermission,
  getBookobecPermissionByUserId,
} from "@/lib/bookobec/queries";
import {
  bookobecPermissionFormSchema,
  bookobecReceiveRegisterSchema,
  bookobecSyncCodeFormSchema,
} from "@/lib/bookobec/schemas";
import {
  getSystemSyncCode,
  isSyncCodeConfigured,
  updateSystemSyncCode,
} from "@/lib/bookobec/sync-code";
import {
  requireBookobecScope,
  requireBookobecSettingsAccess,
} from "@/lib/bookobec/scope";
import { db } from "@/lib/db";
import { bookobecPermissions, users } from "@/lib/db/schema";

const PERMS_PATH = "/modules/bookobec/permissions";
const INBOX_PATH = "/modules/bookobec/inbox";
const SETTINGS_PATH = "/modules/bookobec/settings";

async function requireBookobecStaffPermissionsAccess() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!canManageBookobecStaffPermissions(session.user)) {
    throw new Error("ไม่มีสิทธิ์จัดการสิทธิ์การใช้งานรับส่งหนังสือ สพฐ.");
  }

  return session.user;
}

function parsePermissionForm(formData: FormData) {
  const parsed = bookobecPermissionFormSchema.safeParse({
    userId: formData.get("userId"),
    p1: formData.get("p1"),
    p2: formData.get("p2"),
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

async function assertDistrictUser(userId: number) {
  const [user] = await db
    .select({ organizationType: users.organizationType })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.status, 1)))
    .limit(1);

  return Boolean(user && user.organizationType === "district");
}

export async function createBookobecPermission(formData: FormData) {
  await requireBookobecStaffPermissionsAccess();
  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, p1, p2, officerPersonId } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const existing = await getBookobecPermissionByUserId(userId);
  if (existing) {
    return {
      ok: false,
      message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว — ใช้แก้ไขแทน",
    };
  }

  const [userRow] = await db
    .select({ personId: users.personId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const personId = userRow?.personId ?? "";

  await db.insert(bookobecPermissions).values({
    personId,
    userId,
    p1: p1 ? 1 : 0,
    p2: p2 ? 1 : 0,
    officerPersonId,
  });

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function updateBookobecPermission(id: number, formData: FormData) {
  await requireBookobecStaffPermissionsAccess();
  const row = await getBookobecModulePermission(id);
  if (!row) return { ok: false, message: "ไม่พบข้อมูล" };

  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, p1, p2, officerPersonId } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const other = await getBookobecPermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว" };
  }

  await db
    .update(bookobecPermissions)
    .set({
      userId,
      p1: p1 ? 1 : 0,
      p2: p2 ? 1 : 0,
      officerPersonId,
    })
    .where(eq(bookobecPermissions.id, id));

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function deleteBookobecPermission(id: number) {
  await requireBookobecStaffPermissionsAccess();
  await db.delete(bookobecPermissions).where(eq(bookobecPermissions.id, id));
  revalidatePath(PERMS_PATH);
  return { ok: true as const };
}

export async function updateBookobecSyncCode(formData: FormData) {
  await requireBookobecSettingsAccess();

  const parsed = bookobecSyncCodeFormSchema.safeParse({
    officeCode: formData.get("officeCode"),
    syncCode: formData.get("syncCode"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  await updateSystemSyncCode(parsed.data);
  revalidatePath(SETTINGS_PATH);
  revalidatePath(INBOX_PATH);
  revalidatePath("/modules/bookobec/sent");
  return { ok: true as const };
}

export async function registerBookobecPending(formData: FormData) {
  const { user, perms } = await requireBookobecScope();

  if (!(isBookobecModuleAdmin(user) || perms.p1 === 1)) {
    return { ok: false as const, message: "ไม่มีสิทธิ์รับหนังสือ สพฐ." };
  }

  const syncRow = await getSystemSyncCode();
  if (!isSyncCodeConfigured(syncRow)) {
    return {
      ok: false as const,
      message: "ยังไม่ได้ตั้งค่ารหัสเชื่อม สพฐ. — ไปที่ตั้งค่าระบบ",
    };
  }

  const parsed = bookobecReceiveRegisterSchema.safeParse({
    msIds: formData.getAll("msIds"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const feedResult = await fetchObecPendingFeed({
    officeCode: syncRow.officeCode,
    syncCode: syncRow.syncCode,
    personId: user.personId,
  });

  if (!feedResult.ok) {
    return { ok: false as const, message: feedResult.message };
  }

  const result = await registerObecPendingItems({
    items: feedResult.feed.items,
    selectedMsIds: parsed.data.msIds,
    officerUserId: Number(user.id),
    senderPersonId: user.personId,
  });

  revalidatePath(INBOX_PATH);
  revalidatePath("/modules/book/inbox");
  revalidatePath("/modules/bookregister/receive");

  return {
    ok: result.ok,
    message: result.message,
    registered: result.registered,
    failed: result.failed,
  };
}
