"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { registerPermissions, users } from "@/lib/db/schema";
import {
  canManageDistrictYears,
  getBookregisterPermissions,
} from "@/lib/bookregister/permissions";
import { districtPermissionFormSchema } from "@/lib/bookregister/permissions/schemas";
import {
  getDistrictRegisterPermission,
  getDistrictPermissionByUserId,
} from "@/lib/bookregister/permissions/queries";

const PERMS_PATH = "/modules/bookregister/permissions";

async function requireDistrictPermissionAccess() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBookregisterPermissions(Number(session.user.id));
  if (!canManageDistrictYears(session.user, perms)) {
    throw new Error("ไม่มีสิทธิ์จัดการเจ้าหน้าที่");
  }

  return session.user;
}

function parseForm(formData: FormData) {
  const parsed = districtPermissionFormSchema.safeParse({
    userId: formData.get("userId"),
    p1: formData.get("p1"),
    p2: formData.get("p2"),
    p3: formData.get("p3"),
    canViewSecret: formData.get("canViewSecret"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  return { ok: true as const, data: parsed.data };
}

function toPermissionValues(data: {
  p1: boolean;
  p2: boolean;
  p3: boolean;
  canViewSecret: boolean;
}) {
  return {
    p1: data.p1 ? 1 : 0,
    p2: data.p2 ? 1 : 0,
    p3: data.p3 ? 1 : 0,
    canViewSecret: data.canViewSecret,
  };
}

async function assertDistrictUser(userId: number) {
  const [user] = await db
    .select({ organizationType: users.organizationType })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.status, 1)))
    .limit(1);

  if (!user || user.organizationType !== "district") {
    return false;
  }
  return true;
}

export async function createDistrictRegisterPermission(formData: FormData) {
  await requireDistrictPermissionAccess();
  const parsed = parseForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, ...flags } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const existing = await getDistrictPermissionByUserId(userId);
  if (existing) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว — ใช้แก้ไขแทน" };
  }

  await db.insert(registerPermissions).values({
    userId,
    ...toPermissionValues(flags),
  });

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function updateDistrictRegisterPermission(
  id: number,
  formData: FormData,
) {
  await requireDistrictPermissionAccess();
  const row = await getDistrictRegisterPermission(id);
  if (!row) return { ok: false, message: "ไม่พบข้อมูล" };

  const parsed = parseForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, ...flags } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const other = await getDistrictPermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว" };
  }

  await db
    .update(registerPermissions)
    .set({
      userId,
      ...toPermissionValues(flags),
    })
    .where(eq(registerPermissions.id, id));

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function deleteDistrictRegisterPermission(id: number) {
  await requireDistrictPermissionAccess();
  await db.delete(registerPermissions).where(eq(registerPermissions.id, id));
  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}
