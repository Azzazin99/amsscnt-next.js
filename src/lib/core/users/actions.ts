"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/core/permissions";
import { getUserById, getUserByUsername } from "@/lib/core/users/queries";
import { userCreateSchema, userUpdateSchema } from "@/lib/core/users/schemas";

const USERS_PATH = "/admin/users";

function schoolIdForOrg(
  organizationType: "district" | "school",
  schoolId: number | null,
) {
  return organizationType === "school" ? schoolId : null;
}

export async function createUser(formData: FormData) {
  await requireSystemAdmin();

  const parsed = userCreateSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    personId: formData.get("personId"),
    name: formData.get("name"),
    email: formData.get("email"),
    organizationType: formData.get("organizationType"),
    schoolId: formData.get("schoolId") || null,
    isAdmin: formData.get("isAdmin"),
    status: formData.get("status") ?? 1,
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  if (await getUserByUsername(parsed.data.username)) {
    return { ok: false as const, message: "username นี้มีในระบบแล้ว" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  let insertedId: number;
  try {
    const [inserted] = await db
      .insert(users)
      .values({
        username: parsed.data.username,
        personId: parsed.data.personId,
        email: parsed.data.email,
        passwordHash,
        name: parsed.data.name,
        organizationType: parsed.data.organizationType,
        schoolId: schoolIdForOrg(
          parsed.data.organizationType,
          parsed.data.schoolId,
        ),
        isAdmin: parsed.data.isAdmin,
        isSuperAdmin: parsed.data.isAdmin,
        status: parsed.data.status,
      })
      .returning({ id: users.id });

    if (!inserted) {
      return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
    }
    insertedId = inserted.id;
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(USERS_PATH);
  return { ok: true as const, id: insertedId };
}

export async function updateUser(id: number, formData: FormData) {
  await requireSystemAdmin();

  const existing = await getUserById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบผู้ใช้" };
  }

  const parsed = userUpdateSchema.safeParse({
    personId: formData.get("personId"),
    name: formData.get("name"),
    email: formData.get("email"),
    organizationType: formData.get("organizationType"),
    schoolId: formData.get("schoolId") || null,
    isAdmin: formData.get("isAdmin"),
    status: formData.get("status"),
    password: formData.get("password") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const updates: Record<string, unknown> = {
    personId: parsed.data.personId,
    name: parsed.data.name,
    email: parsed.data.email,
    organizationType: parsed.data.organizationType,
    schoolId: schoolIdForOrg(
      parsed.data.organizationType,
      parsed.data.schoolId,
    ),
    isAdmin: parsed.data.isAdmin,
    isSuperAdmin: existing.isSuperAdmin || parsed.data.isAdmin,
    status: parsed.data.status,
    updatedAt: new Date(),
  };

  if (parsed.data.password) {
    updates.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }

  try {
    await db.update(users).set(updates).where(eq(users.id, id));
  } catch {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(USERS_PATH);
  revalidatePath(`${USERS_PATH}/${id}/edit`);
  return { ok: true as const };
}

export async function setUserStatus(id: number, status: number) {
  await requireSystemAdmin();

  const existing = await getUserById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบผู้ใช้" };
  }

  await db
    .update(users)
    .set({ status, updatedAt: new Date() })
    .where(eq(users.id, id));

  revalidatePath(USERS_PATH);
  return { ok: true as const };
}
