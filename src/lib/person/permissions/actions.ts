"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { personPermissions, users } from "@/lib/db/schema";
import {
  canManagePersonPermissions,
  getPersonPermissions,
} from "@/lib/person/permissions";
import { personPermissionFormSchema } from "@/lib/person/schemas";
import {
  getPersonModulePermission,
  getPersonPermissionByUserId,
} from "@/lib/person/permissions/queries";

const PERMS_PATH = "/modules/person/permissions";

async function requirePersonPermissionAccess() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPersonPermissions(Number(session.user.id));
  if (!canManagePersonPermissions(session.user, perms)) {
    throw new Error("ไม่มีสิทธิ์จัดการสิทธิ์บุคลากร");
  }

  return session.user;
}

function parseForm(formData: FormData) {
  const parsed = personPermissionFormSchema.safeParse({
    userId: formData.get("userId"),
    p1: formData.get("p1"),
    p2: formData.get("p2"),
    p3: formData.get("p3"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  return { ok: true as const, data: parsed.data };
}

function toPermissionValues(data: { p1: boolean; p2: boolean; p3: boolean }) {
  return {
    p1: data.p1 ? 1 : 0,
    p2: data.p2 ? 1 : 0,
    p3: data.p3 ? 1 : 0,
  };
}

async function assertDistrictUser(userId: number) {
  const [user] = await db
    .select({ organizationType: users.organizationType })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.status, 1)))
    .limit(1);

  return Boolean(user && user.organizationType === "district");
}

export async function createPersonModulePermission(formData: FormData) {
  await requirePersonPermissionAccess();
  const parsed = parseForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, ...flags } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const existing = await getPersonPermissionByUserId(userId);
  if (existing) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว — ใช้แก้ไขแทน" };
  }

  await db.insert(personPermissions).values({
    userId,
    ...toPermissionValues(flags),
  });

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function updatePersonModulePermission(
  id: number,
  formData: FormData,
) {
  await requirePersonPermissionAccess();
  const row = await getPersonModulePermission(id);
  if (!row) return { ok: false, message: "ไม่พบข้อมูล" };

  const parsed = parseForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, ...flags } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const other = await getPersonPermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว" };
  }

  await db
    .update(personPermissions)
    .set({
      userId,
      ...toPermissionValues(flags),
    })
    .where(eq(personPermissions.id, id));

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function deletePersonModulePermission(id: number) {
  await requirePersonPermissionAccess();
  await db.delete(personPermissions).where(eq(personPermissions.id, id));
  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}
