"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buildStudentRefId } from "@/lib/student-main/constants";
import { getStudentPermissions } from "@/lib/student-main/permissions";
import {
  canViewStudent,
  getStudent,
  getStudentEdYear,
  getStudentModulePermission,
  getStudentPermissionByUserId,
} from "@/lib/student-main/queries";
import {
  studentEdYearFormSchema,
  studentFormSchema,
  studentPermissionFormSchema,
} from "@/lib/student-main/schemas";
import {
  requireStudentScope,
  requireStudentSettingsAccess,
  requireStudentWriteAccess,
} from "@/lib/student-main/scope";
import { db } from "@/lib/db";
import {
  schools,
  studentEdYears,
  studentPermissions,
  students,
  users,
} from "@/lib/db/schema";

const STUDENTS_PATH = "/modules/student_main/students";
const YEARS_PATH = "/modules/student_main/years";
const PERMS_PATH = "/modules/student_main/permissions";

function todayBangkokDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
  }).format(new Date());
}

async function resolveSchoolName(schoolCode: string): Promise<string> {
  const [row] = await db
    .select({ name: schools.name })
    .from(schools)
    .where(eq(schools.schoolCode, schoolCode))
    .limit(1);
  return row?.name ?? schoolCode;
}

export async function createStudent(formData: FormData) {
  const { user, scope } = await requireStudentWriteAccess();

  const parsed = studentFormSchema.safeParse({
    edYear: formData.get("edYear"),
    schoolCode: formData.get("schoolCode"),
    studentId: formData.get("studentId"),
    personId: formData.get("personId"),
    prename: formData.get("prename"),
    name: formData.get("name"),
    surname: formData.get("surname"),
    sex: formData.get("sex"),
    classLevel: formData.get("classLevel"),
    classroom: formData.get("classroom"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;

  if (scope.kind === "school" && data.schoolCode !== scope.schoolCode) {
    return { ok: false as const, message: "ไม่สามารถบันทึกนักเรียนโรงเรียนอื่นได้" };
  }

  const schoolName = await resolveSchoolName(data.schoolCode);
  const refId = buildStudentRefId(data.schoolCode, data.studentId);

  try {
    const [inserted] = await db
      .insert(students)
      .values({
        edYear: data.edYear,
        refId,
        schoolCode: data.schoolCode,
        studentId: data.studentId,
        personId: data.personId,
        prename: data.prename,
        name: data.name,
        surname: data.surname,
        sex: data.sex,
        schoolName,
        classLevel: data.classLevel,
        classroom: data.classroom,
        disable: 0,
        status: 0,
        recDate: todayBangkokDate(),
        officerPersonId: user.personId,
      })
      .returning({ id: students.id });

    revalidatePath(STUDENTS_PATH);
    redirect(`${STUDENTS_PATH}/${inserted.id}/edit`);
  } catch {
    return {
      ok: false as const,
      message: "ไม่สามารถบันทึกได้ — อาจมีเลขประจำตัวนักเรียนซ้ำในปีนี้",
    };
  }
}

export async function updateStudent(id: number, formData: FormData) {
  const { user, scope } = await requireStudentWriteAccess();
  const existing = await getStudent(id);
  if (!existing) return { ok: false as const, message: "ไม่พบข้อมูล" };
  if (!canViewStudent(existing, scope)) {
    return { ok: false as const, message: "ไม่มีสิทธิ์เข้าถึงรายการนี้" };
  }

  const parsed = studentFormSchema.safeParse({
    edYear: formData.get("edYear"),
    schoolCode: formData.get("schoolCode"),
    studentId: formData.get("studentId"),
    personId: formData.get("personId"),
    prename: formData.get("prename"),
    name: formData.get("name"),
    surname: formData.get("surname"),
    sex: formData.get("sex"),
    classLevel: formData.get("classLevel"),
    classroom: formData.get("classroom"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  if (scope.kind === "school" && data.schoolCode !== scope.schoolCode) {
    return { ok: false as const, message: "ไม่สามารถบันทึกนักเรียนโรงเรียนอื่นได้" };
  }

  const schoolName = await resolveSchoolName(data.schoolCode);
  const refId = buildStudentRefId(data.schoolCode, data.studentId);

  try {
    await db
      .update(students)
      .set({
        edYear: data.edYear,
        refId,
        schoolCode: data.schoolCode,
        studentId: data.studentId,
        personId: data.personId,
        prename: data.prename,
        name: data.name,
        surname: data.surname,
        sex: data.sex,
        schoolName,
        classLevel: data.classLevel,
        classroom: data.classroom,
        officerPersonId: user.personId,
      })
      .where(eq(students.id, id));
  } catch {
    return {
      ok: false as const,
      message: "ไม่สามารถบันทึกได้ — อาจมีเลขประจำตัวนักเรียนซ้ำ",
    };
  }

  revalidatePath(STUDENTS_PATH);
  redirect(`${STUDENTS_PATH}/${id}/edit`);
}

export async function deleteStudent(id: number) {
  const { scope } = await requireStudentWriteAccess();
  const existing = await getStudent(id);
  if (!existing) return { ok: false as const, message: "ไม่พบข้อมูล" };
  if (!canViewStudent(existing, scope)) {
    return { ok: false as const, message: "ไม่มีสิทธิ์ลบรายการนี้" };
  }

  await db.delete(students).where(eq(students.id, id));
  revalidatePath(STUDENTS_PATH);
  redirect(STUDENTS_PATH);
}

async function deactivateOtherStudentYears(exceptId?: number) {
  const rows = await db.select({ id: studentEdYears.id }).from(studentEdYears);
  for (const row of rows) {
    if (exceptId && row.id === exceptId) continue;
    await db
      .update(studentEdYears)
      .set({ yearActive: false })
      .where(eq(studentEdYears.id, row.id));
  }
}

function parseYearForm(formData: FormData) {
  return studentEdYearFormSchema.safeParse({
    edYear: formData.get("edYear"),
    yearActive: formData.get("yearActive"),
  });
}

export async function createStudentEdYear(formData: FormData) {
  await requireStudentSettingsAccess();
  const parsed = parseYearForm(formData);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  if (data.yearActive) await deactivateOtherStudentYears();

  try {
    await db.insert(studentEdYears).values({
      edYear: data.edYear,
      yearActive: data.yearActive,
    });
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกได้ — ปีนี้อาจมีอยู่แล้ว" };
  }

  revalidatePath(YEARS_PATH);
  redirect(YEARS_PATH);
}

export async function updateStudentEdYear(id: number, formData: FormData) {
  await requireStudentSettingsAccess();
  const existing = await getStudentEdYear(id);
  if (!existing) return { ok: false, message: "ไม่พบข้อมูลปีการศึกษา" };

  const parsed = parseYearForm(formData);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  if (data.yearActive) await deactivateOtherStudentYears(id);

  try {
    await db
      .update(studentEdYears)
      .set({
        edYear: data.edYear,
        yearActive: data.yearActive,
      })
      .where(eq(studentEdYears.id, id));
  } catch {
    return { ok: false, message: "ไม่สามารถบันทึกได้ — ปีนี้อาจซ้ำกับรายการอื่น" };
  }

  revalidatePath(YEARS_PATH);
  redirect(YEARS_PATH);
}

export async function toggleStudentEdYearActive(id: number) {
  await requireStudentSettingsAccess();
  const existing = await getStudentEdYear(id);
  if (!existing) return { ok: false, message: "ไม่พบข้อมูล" };

  const nextActive = !existing.yearActive;
  if (nextActive) await deactivateOtherStudentYears(id);

  await db
    .update(studentEdYears)
    .set({ yearActive: nextActive })
    .where(eq(studentEdYears.id, id));

  revalidatePath(YEARS_PATH);
  return { ok: true };
}

export async function deleteStudentEdYear(id: number) {
  await requireStudentSettingsAccess();
  await db.delete(studentEdYears).where(eq(studentEdYears.id, id));
  revalidatePath(YEARS_PATH);
  redirect(YEARS_PATH);
}

function parsePermissionForm(formData: FormData) {
  const parsed = studentPermissionFormSchema.safeParse({
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

export async function createStudentPermission(formData: FormData) {
  await requireStudentSettingsAccess();
  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, ...flags } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const existing = await getStudentPermissionByUserId(userId);
  if (existing) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว — ใช้แก้ไขแทน" };
  }

  await db.insert(studentPermissions).values({
    userId,
    schoolId: null,
    p1: flags.p1 ? 1 : 0,
    p2: flags.p2 ? 1 : 0,
    officerPersonId: flags.officerPersonId,
  });

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function updateStudentPermission(id: number, formData: FormData) {
  await requireStudentSettingsAccess();
  const row = await getStudentModulePermission(id);
  if (!row) return { ok: false, message: "ไม่พบข้อมูล" };

  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, ...flags } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const other = await getStudentPermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว" };
  }

  await db
    .update(studentPermissions)
    .set({
      userId,
      p1: flags.p1 ? 1 : 0,
      p2: flags.p2 ? 1 : 0,
      officerPersonId: flags.officerPersonId,
    })
    .where(eq(studentPermissions.id, id));

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function deleteStudentPermission(id: number) {
  await requireStudentSettingsAccess();
  await db.delete(studentPermissions).where(eq(studentPermissions.id, id));
  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function getStudentPermissionsForSession() {
  const session = await auth();
  if (!session?.user) return { p1: 0, p2: 0, officerPersonId: null };
  const schoolId =
    session.user.organizationType === "school"
      ? (
          await db
            .select({ id: schools.id })
            .from(schools)
            .where(eq(schools.schoolCode, session.user.userSchoolCode ?? ""))
            .limit(1)
        )[0]?.id ?? null
      : null;
  return getStudentPermissions(Number(session.user.id), schoolId);
}
