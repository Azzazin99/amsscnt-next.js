"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { bookPermissions, schools, users } from "@/lib/db/schema";
import { isBookModuleAdmin } from "@/lib/book/permissions";

const BOOK_PERMS_PATH = "/modules/book/permissions";
const SARABAN_PERMS_PATH = "/modules/book/saraban-permissions";
const SCHOOL_SARABAN_PERMS_PATH = "/modules/book/school-saraban-permissions";

async function requireBookAdminAccess() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!isBookModuleAdmin(session.user)) {
    throw new Error("ไม่มีสิทธิ์จัดการสิทธิ์และเจ้าหน้าที่");
  }

  return session.user;
}

async function requireSchoolSarabanAdminAccess() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isDistrictAdmin = isBookModuleAdmin(session.user);
  const isSchoolAdmin =
    session.user.organizationType === "school" &&
    session.user.loginStatus >= 12 &&
    session.user.loginStatus <= 15;

  if (!isDistrictAdmin && !isSchoolAdmin) {
    throw new Error("ไม่มีสิทธิ์จัดการสารบรรณสถานศึกษา");
  }

  return session.user;
}

async function assertDistrictUser(userId: number) {
  const [user] = await db
    .select({ organizationType: users.organizationType })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.status, 1)))
    .limit(1);

  return !!user && user.organizationType === "district";
}

export async function createBookPermission(formData: FormData) {
  await requireBookAdminAccess();
  const userId = Number(formData.get("userId"));
  const p1 = formData.get("p1") === "on" || formData.get("p1") === "1" ? 1 : 0;
  const p2 = formData.get("p2") === "on" || formData.get("p2") === "1" ? 1 : 0;
  const p3 = formData.get("p3") === "on" || formData.get("p3") === "1" ? 1 : 0;
  const canViewSecret = formData.get("canViewSecret") === "on" || formData.get("canViewSecret") === "1";

  if (!userId || isNaN(userId)) {
    return { ok: false, message: "กรุณาเลือกผู้ใช้งาน" };
  }

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const [existing] = await db
    .select()
    .from(bookPermissions)
    .where(eq(bookPermissions.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(bookPermissions)
      .set({ p1, p2, p3, canViewSecret })
      .where(eq(bookPermissions.id, existing.id));
  } else {
    await db.insert(bookPermissions).values({
      userId,
      p1,
      p2,
      p3,
      canViewSecret,
    });
  }

  revalidatePath(BOOK_PERMS_PATH);
  revalidatePath(SARABAN_PERMS_PATH);
  redirect(BOOK_PERMS_PATH);
}

export async function updateBookPermission(id: number, formData: FormData) {
  await requireBookAdminAccess();
  const p1 = formData.get("p1") === "on" || formData.get("p1") === "1" ? 1 : 0;
  const p2 = formData.get("p2") === "on" || formData.get("p2") === "1" ? 1 : 0;
  const p3 = formData.get("p3") === "on" || formData.get("p3") === "1" ? 1 : 0;
  const canViewSecret = formData.get("canViewSecret") === "on" || formData.get("canViewSecret") === "1";

  await db
    .update(bookPermissions)
    .set({ p1, p2, p3, canViewSecret })
    .where(eq(bookPermissions.id, id));

  revalidatePath(BOOK_PERMS_PATH);
  revalidatePath(SARABAN_PERMS_PATH);
  redirect(BOOK_PERMS_PATH);
}

export async function deleteBookPermission(id: number) {
  await requireBookAdminAccess();
  await db.delete(bookPermissions).where(eq(bookPermissions.id, id));
  revalidatePath(BOOK_PERMS_PATH);
  revalidatePath(SARABAN_PERMS_PATH);
  redirect(BOOK_PERMS_PATH);
}

export async function saveSarabanPermission(formData: FormData) {
  await requireBookAdminAccess();
  const userId = Number(formData.get("userId"));
  const p1 = formData.get("p1") === "1" ? 1 : 0;
  const p2 = Number(formData.get("p2")) || 0;

  if (!userId || isNaN(userId)) {
    return { ok: false, message: "กรุณาเลือกผู้ใช้งาน" };
  }

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const [existing] = await db
    .select()
    .from(bookPermissions)
    .where(eq(bookPermissions.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(bookPermissions)
      .set({ p1, p2 })
      .where(eq(bookPermissions.id, existing.id));
  } else {
    await db.insert(bookPermissions).values({
      userId,
      p1,
      p2,
      p3: 0,
      canViewSecret: false,
    });
  }

  revalidatePath(BOOK_PERMS_PATH);
  revalidatePath(SARABAN_PERMS_PATH);
  redirect(SARABAN_PERMS_PATH);
}

export async function updateSarabanPermission(id: number, formData: FormData) {
  await requireBookAdminAccess();
  const p1 = formData.get("p1") === "1" ? 1 : 0;
  const p2 = Number(formData.get("p2")) || 0;

  await db
    .update(bookPermissions)
    .set({ p1, p2 })
    .where(eq(bookPermissions.id, id));

  revalidatePath(BOOK_PERMS_PATH);
  revalidatePath(SARABAN_PERMS_PATH);
  redirect(SARABAN_PERMS_PATH);
}

export async function removeSarabanPermission(id: number) {
  await requireBookAdminAccess();
  await db
    .update(bookPermissions)
    .set({ p1: 0, p2: 0 })
    .where(eq(bookPermissions.id, id));

  revalidatePath(BOOK_PERMS_PATH);
  revalidatePath(SARABAN_PERMS_PATH);
  redirect(SARABAN_PERMS_PATH);
}

export async function saveSchoolSarabanPermission(formData: FormData) {
  const adminUser = await requireSchoolSarabanAdminAccess();
  const userId = Number(formData.get("userId"));

  if (!userId || isNaN(userId)) {
    return { ok: false, message: "กรุณาเลือกผู้ใช้งาน" };
  }

  const [targetUser] = await db
    .select({
      id: users.id,
      organizationType: users.organizationType,
      schoolId: users.schoolId,
      schoolCode: schools.schoolCode,
    })
    .from(users)
    .leftJoin(schools, eq(users.schoolId, schools.id))
    .where(and(eq(users.id, userId), eq(users.status, 1)))
    .limit(1);

  if (!targetUser || targetUser.organizationType !== "school" || !targetUser.schoolCode) {
    return { ok: false, message: "บุคลากรที่เลือกสังกัดโรงเรียนไม่ถูกต้อง" };
  }

  if (
    adminUser.organizationType === "school" &&
    adminUser.userSchoolCode !== targetUser.schoolCode
  ) {
    return { ok: false, message: "ไม่มีสิทธิ์จัดการบุคลากรนอกโรงเรียนของตนเอง" };
  }

  const schoolCodeNum = Number(targetUser.schoolCode);

  const [existing] = await db
    .select()
    .from(bookPermissions)
    .where(eq(bookPermissions.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(bookPermissions)
      .set({ p3: schoolCodeNum })
      .where(eq(bookPermissions.id, existing.id));
  } else {
    await db.insert(bookPermissions).values({
      userId,
      p1: 0,
      p2: 0,
      p3: schoolCodeNum,
      canViewSecret: false,
    });
  }

  revalidatePath(SCHOOL_SARABAN_PERMS_PATH);
  redirect(SCHOOL_SARABAN_PERMS_PATH);
}

export async function removeSchoolSarabanPermission(id: number) {
  const adminUser = await requireSchoolSarabanAdminAccess();

  const [targetPermission] = await db
    .select({
      id: bookPermissions.id,
      userId: bookPermissions.userId,
      schoolCode: schools.schoolCode,
    })
    .from(bookPermissions)
    .innerJoin(users, eq(bookPermissions.userId, users.id))
    .leftJoin(schools, eq(users.schoolId, schools.id))
    .where(eq(bookPermissions.id, id))
    .limit(1);

  if (!targetPermission) {
    return { ok: false, message: "ไม่พบรายการสิทธิ์" };
  }

  if (
    adminUser.organizationType === "school" &&
    adminUser.userSchoolCode !== targetPermission.schoolCode
  ) {
    return { ok: false, message: "ไม่มีสิทธิ์จัดการบุคลากรนอกโรงเรียนของตนเอง" };
  }

  await db
    .update(bookPermissions)
    .set({ p3: 0 })
    .where(eq(bookPermissions.id, id));

  revalidatePath(SCHOOL_SARABAN_PERMS_PATH);
  redirect(SCHOOL_SARABAN_PERMS_PATH);
}
