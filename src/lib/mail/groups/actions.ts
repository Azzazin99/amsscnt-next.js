"use server";

import { insertAndGetId } from "../../db/helpers";

import { and, eq, like, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { mailGroupMembers, mailGroups } from "@/lib/db/schema";
import { mailGroupSchema } from "@/lib/mail/schemas";
import {
  getMailGroupById,
  listMailGroupMemberIds,
} from "@/lib/mail/groups/queries";
import { requireMailSettingsAccess } from "@/lib/mail/scope";

const GROUPS_PATH = "/modules/mail/groups";

function parseForm(formData: FormData) {
  const personIds = formData
    .getAll("personIds")
    .map((v) => v.toString().trim())
    .filter((v) => v.length > 0);

  return mailGroupSchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
    personIds,
  });
}

async function nameTaken(name: string, excludeId?: number): Promise<boolean> {
  const trimmed = name.trim();
  const [row] = await db
    .select({ id: mailGroups.id })
    .from(mailGroups)
    .where(
      excludeId != null
        ? and(like(mailGroups.name, trimmed), ne(mailGroups.id, excludeId))
        : like(mailGroups.name, trimmed),
    )
    .limit(1);
  return row != null;
}

async function syncMembers(groupId: number, personIds: string[]) {
  const existing = await listMailGroupMemberIds(groupId);
  const next = new Set(personIds);
  const toRemove = existing.filter((id) => !next.has(id));
  const toAdd = personIds.filter((id) => !existing.includes(id));

  if (toRemove.length > 0) {
    for (const personId of toRemove) {
      await db
        .delete(mailGroupMembers)
        .where(
          and(
            eq(mailGroupMembers.groupId, groupId),
            eq(mailGroupMembers.personId, personId),
          ),
        );
    }
  }

  if (toAdd.length > 0) {
    await db.insert(mailGroupMembers).values(
      toAdd.map((personId) => ({ groupId, personId })),
    );
  }
}

export async function createMailGroup(formData: FormData) {
  await requireMailSettingsAccess();

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

  const insertedId = await insertAndGetId(mailGroups, {
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder,
    });
  const inserted = { id: insertedId };

  if (!inserted) {
    return { ok: false as const, message: "ไม่สามารถบันทึกได้" };
  }

  if (parsed.data.personIds.length > 0) {
    await db.insert(mailGroupMembers).values(
      parsed.data.personIds.map((personId) => ({
        groupId: inserted.id,
        personId,
      })),
    );
  }

  revalidatePath(GROUPS_PATH);
  return { ok: true as const, id: inserted.id };
}

export async function updateMailGroup(id: number, formData: FormData) {
  await requireMailSettingsAccess();

  const existing = await getMailGroupById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบกลุ่มบุคลากร" };
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
    .update(mailGroups)
    .set({
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder,
    })
    .where(eq(mailGroups.id, id));

  await syncMembers(id, parsed.data.personIds);

  revalidatePath(GROUPS_PATH);
  revalidatePath(`${GROUPS_PATH}/${id}/edit`);
  return { ok: true as const };
}

export async function deleteMailGroup(id: number) {
  await requireMailSettingsAccess();

  const existing = await getMailGroupById(id);
  if (!existing) {
    return { ok: false as const, message: "ไม่พบกลุ่มบุคลากร" };
  }

  await db.delete(mailGroups).where(eq(mailGroups.id, id));

  revalidatePath(GROUPS_PATH);
  return { ok: true as const };
}
