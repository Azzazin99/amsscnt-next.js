"use server";

import { insertAndGetId } from "../db/helpers";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { todayBangkokDateString } from "@/lib/bookregister/receive/ref-id";
import {
  buildStoredNewsFileName,
  deleteNewsFileFromStorage,
  isAllowedNewsFileName,
  saveNewsFileToStorage,
} from "@/lib/news/files";
import { canManageNewsSettings } from "@/lib/news/permissions";
import {
  findDuplicateSectionCode,
  getActiveNewsMainitem,
  getNewsArticle,
  getNewsMainitem,
  getNewsMainitemByCode,
  getNewsModulePermission,
  getNewsPermissionByUserId,
  getNewsSection,
} from "@/lib/news/queries";
import {
  newsArticleFormSchema,
  newsMainitemFormSchema,
  newsPermissionFormSchema,
  newsSectionFormSchema,
} from "@/lib/news/schemas";
import {
  requireNewsSettingsAccess,
  requireNewsWriteAccess,
} from "@/lib/news/scope";
import { db } from "@/lib/db";
import {
  newsArticles,
  newsMainitems,
  newsPermissions,
  newsSections,
} from "@/lib/db/schema";

const LIST_PATH = "/modules/news";
const SECTIONS_PATH = "/modules/news/sections";
const MAINITEMS_PATH = "/modules/news/mainitems";
const PERMS_PATH = "/modules/news/permissions";

async function deactivateOtherNewsMainitems(exceptId?: number) {
  const rows = await db.select({ id: newsMainitems.id }).from(newsMainitems);
  for (const row of rows) {
    if (exceptId && row.id === exceptId) continue;
    await db
      .update(newsMainitems)
      .set({ itemActive: false })
      .where(eq(newsMainitems.id, row.id));
  }
}

async function requireNewsSettingsAccessFromSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canManageNewsSettings(session.user)) {
    throw new Error("ไม่มีสิทธิ์จัดการตั้งค่าข่าว");
  }
  return session.user;
}

function parsePermissionForm(formData: FormData) {
  const parsed = newsPermissionFormSchema.safeParse({
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

export async function createNewsMainitem(formData: FormData) {
  await requireNewsSettingsAccessFromSession();

  const parsed = newsMainitemFormSchema.safeParse({
    code: formData.get("code"),
    mainitem: formData.get("mainitem"),
    itemActive: formData.get("itemActive"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const existing = await getNewsMainitemByCode(parsed.data.code);
  if (existing) {
    return { ok: false as const, message: "มีรหัสซ้ำกับรายการที่มีอยู่แล้ว" };
  }

  if (parsed.data.itemActive) {
    await deactivateOtherNewsMainitems();
  }

  await db.insert(newsMainitems).values({
    code: parsed.data.code,
    mainitem: parsed.data.mainitem,
    itemActive: parsed.data.itemActive,
  });

  revalidatePath(MAINITEMS_PATH);
  revalidatePath(LIST_PATH);
  redirect(MAINITEMS_PATH);
}

export async function updateNewsMainitem(id: number, formData: FormData) {
  await requireNewsSettingsAccessFromSession();

  const row = await getNewsMainitem(id);
  if (!row) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = newsMainitemFormSchema.safeParse({
    code: formData.get("code"),
    mainitem: formData.get("mainitem"),
    itemActive: formData.get("itemActive"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const other = await getNewsMainitemByCode(parsed.data.code);
  if (other && other.id !== id) {
    return { ok: false as const, message: "มีรหัสซ้ำกับรายการที่มีอยู่แล้ว" };
  }

  if (parsed.data.itemActive) {
    await deactivateOtherNewsMainitems(id);
  }

  await db
    .update(newsMainitems)
    .set({
      code: parsed.data.code,
      mainitem: parsed.data.mainitem,
      itemActive: parsed.data.itemActive,
    })
    .where(eq(newsMainitems.id, id));

  revalidatePath(MAINITEMS_PATH);
  revalidatePath(LIST_PATH);
  redirect(MAINITEMS_PATH);
}

export async function deleteNewsMainitem(id: number) {
  await requireNewsSettingsAccess();
  await db.delete(newsMainitems).where(eq(newsMainitems.id, id));
  revalidatePath(MAINITEMS_PATH);
  revalidatePath(LIST_PATH);
  return { ok: true as const };
}

export async function createNewsSection(formData: FormData) {
  await requireNewsSettingsAccessFromSession();
  const active = await getActiveNewsMainitem();
  if (!active) {
    return {
      ok: false as const,
      message: "ยังไม่ได้กำหนดชื่อเรื่องปัจจุบัน — ไปที่กำหนดชื่อเรื่องก่อน",
    };
  }

  const parsed = newsSectionFormSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const dup = await findDuplicateSectionCode(active.code, parsed.data.code);
  if (dup) {
    return { ok: false as const, message: "มีรหัสซ้ำกับรายการที่มีอยู่แล้ว" };
  }

  await db.insert(newsSections).values({
    code: parsed.data.code,
    name: parsed.data.name,
    mainitemCode: active.code,
  });

  revalidatePath(SECTIONS_PATH);
  revalidatePath(LIST_PATH);
  redirect(SECTIONS_PATH);
}

export async function updateNewsSection(id: number, formData: FormData) {
  await requireNewsSettingsAccessFromSession();
  const section = await getNewsSection(id);
  if (!section) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = newsSectionFormSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const dup = await findDuplicateSectionCode(
    section.mainitemCode,
    parsed.data.code,
    id,
  );
  if (dup) {
    return { ok: false as const, message: "มีรหัสซ้ำกับรายการที่มีอยู่แล้ว" };
  }

  await db
    .update(newsSections)
    .set({ code: parsed.data.code, name: parsed.data.name })
    .where(eq(newsSections.id, id));

  revalidatePath(SECTIONS_PATH);
  revalidatePath(LIST_PATH);
  redirect(SECTIONS_PATH);
}

export async function deleteNewsSection(id: number) {
  await requireNewsSettingsAccess();
  await db.delete(newsSections).where(eq(newsSections.id, id));
  revalidatePath(SECTIONS_PATH);
  revalidatePath(LIST_PATH);
  return { ok: true as const };
}

export async function createNewsArticle(formData: FormData) {
  const { user } = await requireNewsWriteAccess();
  const active = await getActiveNewsMainitem();
  if (!active) {
    return {
      ok: false as const,
      message: "ยังไม่ได้กำหนดชื่อเรื่องปัจจุบัน",
    };
  }

  const parsed = newsArticleFormSchema.safeParse({
    sectionCode: formData.get("sectionCode"),
    news: formData.get("news"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  let storedFile: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (!isAllowedNewsFileName(file.name)) {
      return { ok: false as const, message: "ชนิดไฟล์ไม่รองรับ" };
    }
    if (file.size > 20 * 1024 * 1024) {
      return { ok: false as const, message: "ไฟล์ใหญ่เกินไป (เกิน 20MB)" };
    }
    storedFile = buildStoredNewsFileName(file.name);
    await saveNewsFileToStorage(storedFile, file);
  }

  const insertedId = await insertAndGetId(newsArticles, {
      news: parsed.data.news,
      sectionCode: parsed.data.sectionCode,
      mainitemCode: active.code,
      officerPersonId: user.personId,
      file: storedFile,
    });
  const inserted = { id: insertedId };

  if (!inserted) {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  revalidatePath(LIST_PATH);
  return { ok: true as const, id: inserted.id };
}

export async function updateNewsArticle(id: number, formData: FormData) {
  await requireNewsWriteAccess();
  const article = await getNewsArticle(id);
  if (!article) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = newsArticleFormSchema.safeParse({
    sectionCode: formData.get("sectionCode"),
    news: formData.get("news"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  let storedFile = article.file;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (!isAllowedNewsFileName(file.name)) {
      return { ok: false as const, message: "ชนิดไฟล์ไม่รองรับ" };
    }
    if (file.size > 20 * 1024 * 1024) {
      return { ok: false as const, message: "ไฟล์ใหญ่เกินไป (เกิน 20MB)" };
    }
    if (article.file) {
      try {
        await deleteNewsFileFromStorage(article.file);
      } catch {
        // ignore
      }
    }
    storedFile = buildStoredNewsFileName(file.name);
    await saveNewsFileToStorage(storedFile, file);
  }

  await db
    .update(newsArticles)
    .set({
      news: parsed.data.news,
      sectionCode: parsed.data.sectionCode,
      file: storedFile,
    })
    .where(eq(newsArticles.id, id));

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}/edit`);
  return { ok: true as const };
}

export async function deleteNewsArticle(id: number) {
  await requireNewsWriteAccess();
  const article = await getNewsArticle(id);
  if (article?.file) {
    try {
      await deleteNewsFileFromStorage(article.file);
    } catch {
      // ignore
    }
  }
  await db.delete(newsArticles).where(eq(newsArticles.id, id));
  revalidatePath(LIST_PATH);
  return { ok: true as const };
}

export async function createNewsPermission(formData: FormData) {
  const officer = await requireNewsSettingsAccessFromSession();
  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return parsed;

  const { userId, p1, officerPersonId } = parsed.data;
  const existing = await getNewsPermissionByUserId(userId);
  if (existing) {
    return {
      ok: false as const,
      message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว — ใช้แก้ไขแทน",
    };
  }

  await db.insert(newsPermissions).values({
    userId,
    p1: p1 ? 1 : 0,
    officerPersonId: officerPersonId ?? officer.personId,
    recDate: todayBangkokDateString(),
  });

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function updateNewsPermission(id: number, formData: FormData) {
  await requireNewsSettingsAccessFromSession();
  const row = await getNewsModulePermission(id);
  if (!row) return { ok: false as const, message: "ไม่พบข้อมูล" };

  const parsed = parsePermissionForm(formData);
  if (!parsed.ok) return parsed;

  const { userId, p1, officerPersonId } = parsed.data;
  const other = await getNewsPermissionByUserId(userId);
  if (other && other.id !== id) {
    return { ok: false as const, message: "บุคลากรนี้มีสิทธิ์อยู่แล้ว" };
  }

  const session = await auth();
  await db
    .update(newsPermissions)
    .set({
      userId,
      p1: p1 ? 1 : 0,
      officerPersonId: officerPersonId ?? session?.user?.personId ?? null,
      recDate: todayBangkokDateString(),
    })
    .where(eq(newsPermissions.id, id));

  revalidatePath(PERMS_PATH);
  redirect(PERMS_PATH);
}

export async function deleteNewsPermission(id: number) {
  await requireNewsSettingsAccess();
  await db.delete(newsPermissions).where(eq(newsPermissions.id, id));
  revalidatePath(PERMS_PATH);
  return { ok: true as const };
}
