"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { computeScoreAvg } from "@/lib/achievement/constants";
import {
  canManageAchievementSettings,
  getAchievementPermissions,
} from "@/lib/achievement/permissions";
import {
  getAchievementModulePermission,
  getAchievementPermissionByUserId,
  getAchievementScore,
} from "@/lib/achievement/queries";
import {
  achievementPermissionFormSchema,
  achievementScoreFormSchema,
} from "@/lib/achievement/schemas";
import {
  requireAchievementScope,
  requireAchievementWriteAccess,
} from "@/lib/achievement/scope";
import { db } from "@/lib/db";
import { achievementPermissions, achievementScores, users } from "@/lib/db/schema";

const SCORES_PATH = "/modules/achievement/scores";
const PERMS_PATH = "/modules/achievement/permissions";

async function requireAchievementSettingsAccess() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getAchievementPermissions(Number(session.user.id));
  if (!canManageAchievementSettings(session.user, perms)) {
    redirect(SCORES_PATH);
  }

  return session.user;
}

function todayBangkokDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
  }).format(new Date());
}

export async function createAchievementScore(formData: FormData) {
  const { user } = await requireAchievementWriteAccess();

  const parsed = achievementScoreFormSchema.safeParse({
    testType: formData.get("testType"),
    testClass: formData.get("testClass"),
    edYear: formData.get("edYear"),
    schoolCode: formData.get("schoolCode"),
    thai: formData.get("thai"),
    math: formData.get("math"),
    science: formData.get("science"),
    social: formData.get("social"),
    english: formData.get("english"),
    health: formData.get("health"),
    art: formData.get("art"),
    vocation: formData.get("vocation"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  const scoreAvg = computeScoreAvg(data);

  try {
    const [inserted] = await db
      .insert(achievementScores)
      .values({
        testType: data.testType,
        testClass: data.testClass,
        edYear: data.edYear,
        schoolCode: data.schoolCode,
        thai: data.thai,
        math: data.math,
        science: data.science,
        social: data.social,
        english: data.english,
        health: data.health,
        art: data.art,
        vocation: data.vocation,
        scoreAvg,
        officerPersonId: user.personId,
        recDate: todayBangkokDate(),
      })
      .returning({ id: achievementScores.id });

    revalidatePath(SCORES_PATH);
    redirect(`${SCORES_PATH}/${inserted.id}/edit`);
  } catch {
    return {
      ok: false as const,
      message: "ไม่สามารถบันทึกได้ — อาจมีคะแนนของโรงเรียนนี้ในปี/ชั้นนี้แล้ว",
    };
  }
}

export async function updateAchievementScore(id: number, formData: FormData) {
  await requireAchievementWriteAccess();
  const existing = await getAchievementScore(id);
  if (!existing) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = achievementScoreFormSchema.safeParse({
    testType: formData.get("testType"),
    testClass: formData.get("testClass"),
    edYear: formData.get("edYear"),
    schoolCode: formData.get("schoolCode"),
    thai: formData.get("thai"),
    math: formData.get("math"),
    science: formData.get("science"),
    social: formData.get("social"),
    english: formData.get("english"),
    health: formData.get("health"),
    art: formData.get("art"),
    vocation: formData.get("vocation"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const { data } = parsed;
  const scoreAvg = computeScoreAvg(data);
  const session = await auth();

  try {
    await db
      .update(achievementScores)
      .set({
        testType: data.testType,
        testClass: data.testClass,
        edYear: data.edYear,
        schoolCode: data.schoolCode,
        thai: data.thai,
        math: data.math,
        science: data.science,
        social: data.social,
        english: data.english,
        health: data.health,
        art: data.art,
        vocation: data.vocation,
        scoreAvg,
        officerPersonId: session?.user.personId ?? existing.schoolCode,
        recDate: todayBangkokDate(),
      })
      .where(eq(achievementScores.id, id));
  } catch {
    return {
      ok: false as const,
      message: "ไม่สามารถบันทึกได้ — อาจซ้ำกับรายการอื่น",
    };
  }

  revalidatePath(SCORES_PATH);
  redirect(`${SCORES_PATH}/${id}/edit`);
}

function parsePermissionForm(formData: FormData) {
  const parsed = achievementPermissionFormSchema.safeParse({
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

function toPermissionValues(data: {
  p1: boolean;
  p2: boolean;
  p3: boolean;
  officerPersonId: string | null;
}) {
  return {
    p1: data.p1 ? 1 : 0,
    p2: data.p2 ? 1 : 0,
    p3: data.p3 ? 1 : 0,
    officerPersonId: data.officerPersonId,
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

export async function createAchievementPermission(formData: FormData) {
  await requireAchievementSettingsAccess();
  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, ...flags } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const existing = await getAchievementPermissionByUserId(userId);
  if (existing) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว — ใช้แก้ไขแทน" };
  }

  await db.insert(achievementPermissions).values({
    userId,
    ...toPermissionValues(flags),
  });

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function updateAchievementPermission(id: number, formData: FormData) {
  await requireAchievementSettingsAccess();
  const row = await getAchievementModulePermission(id);
  if (!row) return { ok: false, message: "ไม่พบข้อมูล" };

  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const { userId, ...flags } = parsed.data;

  if (!(await assertDistrictUser(userId))) {
    return { ok: false, message: "บุคลากรที่เลือกไม่ใช่ระดับเขต" };
  }

  const other = await getAchievementPermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว" };
  }

  await db
    .update(achievementPermissions)
    .set({
      userId,
      ...toPermissionValues(flags),
    })
    .where(eq(achievementPermissions.id, id));

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function deleteAchievementPermission(id: number) {
  await requireAchievementSettingsAccess();
  await db.delete(achievementPermissions).where(eq(achievementPermissions.id, id));
  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function deleteAchievementScore(id: number) {
  await requireAchievementWriteAccess();
  await requireAchievementScope();
  await db.delete(achievementScores).where(eq(achievementScores.id, id));
  revalidatePath(SCORES_PATH);
  redirect(SCORES_PATH);
}
