"use server";

import { insertAndGetId } from "../db/helpers";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canViewSpacialStudent,
  getSpacialStudent,
  getSpacialStudentModulePermission,
  getSpacialStudentPermissionByUserId,
} from "@/lib/spacial-student/queries";
import {
  spacialStudentFormSchema,
  spacialStudentPermissionFormSchema,
} from "@/lib/spacial-student/schemas";
import {
  requireSpacialStudentScope,
  requireSpacialStudentSettingsAccess,
  requireSpacialStudentWriteAccess,
} from "@/lib/spacial-student/scope";
import { db } from "@/lib/db";
import {
  spacialStudentDisabled,
  spacialStudentPermissions,
  users,
} from "@/lib/db/schema";

const STUDENTS_PATH = "/modules/spacial_student/students";
const PERMS_PATH = "/modules/spacial_student/permissions";

function todayBangkokDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
  }).format(new Date());
}

export async function createSpacialStudent(formData: FormData) {
  const { user, scope } = await requireSpacialStudentWriteAccess();

  const parsed = spacialStudentFormSchema.safeParse({
    personId: formData.get("personId"),
    schoolCode: formData.get("schoolCode"),
    disableType: formData.get("disableType"),
    disableDetail: formData.get("disableDetail"),
    other: formData.get("other"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;

  if (scope.kind === "school" && data.schoolCode !== scope.schoolCode) {
    return {
      ok: false as const,
      message: "ไม่สามารถบันทึกนักเรียนโรงเรียนอื่นได้",
    };
  }

  try {
    const insertedId = await insertAndGetId(spacialStudentDisabled, {
        personId: data.personId,
        schoolCode: data.schoolCode,
        disableType: data.disableType,
        disableDetail: data.disableDetail,
        other: data.other,
        pic: "",
        status: data.status,
        officerPersonId: user.personId,
        recDate: todayBangkokDate(),
      });
  const inserted = { id: insertedId };

    revalidatePath(STUDENTS_PATH);
    redirect(`${STUDENTS_PATH}/${inserted.id}/edit`);
  } catch {
    return {
      ok: false as const,
      message: "ไม่สามารถบันทึกได้ — อาจมีรายการของนักเรียนคนนี้แล้ว",
    };
  }
}

export async function updateSpacialStudent(id: number, formData: FormData) {
  const { user, scope } = await requireSpacialStudentWriteAccess();
  const existing = await getSpacialStudent(id);
  if (!existing) return { ok: false as const, message: "ไม่พบข้อมูล" };
  if (!canViewSpacialStudent(existing, scope)) {
    return { ok: false as const, message: "ไม่มีสิทธิ์เข้าถึงรายการนี้" };
  }

  const parsed = spacialStudentFormSchema.safeParse({
    personId: formData.get("personId"),
    schoolCode: formData.get("schoolCode"),
    disableType: formData.get("disableType"),
    disableDetail: formData.get("disableDetail"),
    other: formData.get("other"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  if (scope.kind === "school" && data.schoolCode !== scope.schoolCode) {
    return {
      ok: false as const,
      message: "ไม่สามารถบันทึกนักเรียนโรงเรียนอื่นได้",
    };
  }

  try {
    await db
      .update(spacialStudentDisabled)
      .set({
        personId: data.personId,
        schoolCode: data.schoolCode,
        disableType: data.disableType,
        disableDetail: data.disableDetail,
        other: data.other,
        status: data.status,
        officerPersonId: user.personId,
        recDate: todayBangkokDate(),
      })
      .where(eq(spacialStudentDisabled.id, id));
  } catch {
    return {
      ok: false as const,
      message: "ไม่สามารถบันทึกได้ — อาจซ้ำกับรายการอื่น",
    };
  }

  revalidatePath(STUDENTS_PATH);
  redirect(`${STUDENTS_PATH}/${id}/edit`);
}

export async function deleteSpacialStudent(id: number) {
  const { scope } = await requireSpacialStudentWriteAccess();
  const existing = await getSpacialStudent(id);
  if (!existing) return { ok: false as const, message: "ไม่พบข้อมูล" };
  if (!canViewSpacialStudent(existing, scope)) {
    return { ok: false as const, message: "ไม่มีสิทธิ์ลบรายการนี้" };
  }

  await db.delete(spacialStudentDisabled).where(eq(spacialStudentDisabled.id, id));
  revalidatePath(STUDENTS_PATH);
  redirect(STUDENTS_PATH);
}

function parsePermissionForm(formData: FormData) {
  const parsed = spacialStudentPermissionFormSchema.safeParse({
    userId: formData.get("userId"),
    p1: formData.get("p1"),
    p2: formData.get("p2"),
    p3: formData.get("p3"),
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

export async function createSpacialStudentPermission(formData: FormData) {
  await requireSpacialStudentSettingsAccess();
  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, ...flags } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const existing = await getSpacialStudentPermissionByUserId(userId);
  if (existing) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว — ใช้แก้ไขแทน" };
  }

  await db.insert(spacialStudentPermissions).values({
    userId,
    schoolId: null,
    p1: flags.p1 ? 1 : 0,
    p2: flags.p2 ? 1 : 0,
    p3: flags.p3 ? 1 : 0,
    officerPersonId: flags.officerPersonId,
  });

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function updateSpacialStudentPermission(
  id: number,
  formData: FormData,
) {
  await requireSpacialStudentSettingsAccess();
  const row = await getSpacialStudentModulePermission(id);
  if (!row) return { ok: false, message: "ไม่พบข้อมูล" };

  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, ...flags } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const other = await getSpacialStudentPermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว" };
  }

  await db
    .update(spacialStudentPermissions)
    .set({
      userId,
      p1: flags.p1 ? 1 : 0,
      p2: flags.p2 ? 1 : 0,
      p3: flags.p3 ? 1 : 0,
      officerPersonId: flags.officerPersonId,
    })
    .where(eq(spacialStudentPermissions.id, id));

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function deleteSpacialStudentPermission(id: number) {
  await requireSpacialStudentSettingsAccess();
  await db
    .delete(spacialStudentPermissions)
    .where(eq(spacialStudentPermissions.id, id));
  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}
