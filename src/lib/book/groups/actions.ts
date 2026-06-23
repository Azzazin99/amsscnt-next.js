"use server";

import { and, eq, ilike, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { bookGroupMembers, bookGroups } from "@/lib/db/schema";
import { canManageBookGroups } from "@/lib/book/permissions";
import { bookGroupSchema } from "@/lib/book/groups/schemas";
import {
  getBookGroupById,
  listBookGroupMemberIds,
} from "@/lib/book/groups/queries";
import { requireBookScope } from "@/lib/book/scope";

const GROUPS_PATH = "/modules/book/groups";

function parseForm(formData: FormData) {
  const schoolIds = formData
    .getAll("schoolIds")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);

  return bookGroupSchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
    schoolIds,
  });
}

async function requireGroupAdmin() {
  const ctx = await requireBookScope();
  if (!canManageBookGroups(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์จัดการกลุ่มหนังสือ");
  }
  return ctx;
}

async function nameTaken(name: string, excludeId?: number): Promise<boolean> {
  const trimmed = name.trim();
  const [row] = await db
    .select({ id: bookGroups.id })
    .from(bookGroups)
    .where(
      excludeId != null
        ? and(ilike(bookGroups.name, trimmed), ne(bookGroups.id, excludeId))
        : ilike(bookGroups.name, trimmed),
    )
    .limit(1);
  return row != null;
}

async function syncMembers(groupId: number, schoolIds: number[]) {
  const existing = await listBookGroupMemberIds(groupId);
  const next = new Set(schoolIds);
  const toRemove = existing.filter((id) => !next.has(id));
  const toAdd = schoolIds.filter((id) => !existing.includes(id));

  if (toRemove.length > 0) {
    for (const schoolId of toRemove) {
      await db
        .delete(bookGroupMembers)
        .where(
          and(
            eq(bookGroupMembers.groupId, groupId),
            eq(bookGroupMembers.schoolId, schoolId),
          ),
        );
    }
  }

  if (toAdd.length > 0) {
    await db.insert(bookGroupMembers).values(
      toAdd.map((schoolId) => ({ groupId, schoolId })),
    );
  }
}

export async function createBookGroup(formData: FormData) {
  await requireGroupAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  if (await nameTaken(parsed.data.name)) {
    return { ok: false as const, message: "ชื่อกลุ่มนี้มีในระบบแล้ว" };
  }

  const [inserted] = await db
    .insert(bookGroups)
    .values({
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder,
    })
    .returning({ id: bookGroups.id });

  if (!inserted) {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  if (parsed.data.schoolIds.length > 0) {
    await db.insert(bookGroupMembers).values(
      parsed.data.schoolIds.map((schoolId) => ({
        groupId: inserted.id,
        schoolId,
      })),
    );
  }

  revalidatePath(GROUPS_PATH);
  return { ok: true as const, id: inserted.id };
}

export async function updateBookGroup(id: number, formData: FormData) {
  await requireGroupAdmin();

  const existing = await getBookGroupById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบกลุ่มหนังสือ" };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  if (await nameTaken(parsed.data.name, id)) {
    return { ok: false as const, message: "ชื่อกลุ่มนี้มีในระบบแล้ว" };
  }

  await db
    .update(bookGroups)
    .set({
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder,
    })
    .where(eq(bookGroups.id, id));

  await syncMembers(id, parsed.data.schoolIds);

  revalidatePath(GROUPS_PATH);
  revalidatePath(`${GROUPS_PATH}/${id}/edit`);
  return { ok: true as const };
}

export async function deleteBookGroup(id: number) {
  await requireGroupAdmin();

  const existing = await getBookGroupById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบกลุ่มหนังสือ" };
  }

  await db.delete(bookGroups).where(eq(bookGroups.id, id));

  revalidatePath(GROUPS_PATH);
  return { ok: true as const };
}
