"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { registerPermissions, users } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/core/permissions";
import { districtPermissionFormSchema } from "@/lib/bookregister/permissions/schemas";
import {
  getDistrictRegisterPermission,
  getDistrictPermissionByUserId,
} from "@/lib/bookregister/permissions/queries";

const PERMS_PATH = "/admin/permissions";

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

function toValues(data: {
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

  return user?.organizationType === "district";
}

export async function createAdminRegisterPermission(formData: FormData) {
  await requireSystemAdmin();
  const parsed = parseForm(formData);
  if (!parsed.ok) return parsed;

  const { userId, ...flags } = parsed.data;
  if (!(await assertDistrictUser(userId))) {
    return { ok: false as const, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const existing = await getDistrictPermissionByUserId(userId);
  if (existing) {
    return { ok: false as const, message: "ผู้ใช้นี้มีสิทธิ์อยู่แล้ว" };
  }

  await db.insert(registerPermissions).values({
    userId,
    ...toValues(flags),
  });

  revalidatePath(PERMS_PATH);
  revalidatePath("/modules/bookregister/permissions");
  return { ok: true as const };
}

export async function updateAdminRegisterPermission(
  id: number,
  formData: FormData,
) {
  await requireSystemAdmin();
  const row = await getDistrictRegisterPermission(id);
  if (!row) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = parseForm(formData);
  if (!parsed.ok) return parsed;

  const { userId, ...flags } = parsed.data;
  if (!(await assertDistrictUser(userId))) {
    return { ok: false as const, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const other = await getDistrictPermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false as const, message: "ผู้ใช้นี้มีสิทธิ์อยู่แล้ว" };
  }

  await db
    .update(registerPermissions)
    .set({ userId, ...toValues(flags) })
    .where(eq(registerPermissions.id, id));

  revalidatePath(PERMS_PATH);
  revalidatePath("/modules/bookregister/permissions");
  return { ok: true as const };
}

export async function deleteAdminRegisterPermission(id: number) {
  await requireSystemAdmin();
  await db.delete(registerPermissions).where(eq(registerPermissions.id, id));
  revalidatePath(PERMS_PATH);
  revalidatePath("/modules/bookregister/permissions");
  return { ok: true as const };
}
