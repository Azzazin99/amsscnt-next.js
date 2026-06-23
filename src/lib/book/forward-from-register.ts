"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { forwardRegisterSendToBook } from "@/lib/book/registry-link";
import { requireBookWriteAccess } from "@/lib/book/scope";
import { requireBookregisterWriteScope } from "@/lib/bookregister/scope";
import { getDistrictSend } from "@/lib/bookregister/send/queries";

const forwardSchema = z.object({
  recipientMode: z.enum(["all_schools", "selected_schools", "book_group"]),
  groupId: z.coerce.number().int().positive().optional(),
  schoolIds: z.array(z.coerce.number().int().positive()).optional(),
});

const SEND_PATH = "/modules/bookregister/send";
const BOOK_SENT_PATH = "/modules/book/sent";

export async function forwardSendToBook(formData: FormData) {
  const registerSendId = Number(formData.get("registerSendId"));
  if (!Number.isFinite(registerSendId)) {
    return { ok: false as const, message: "ไม่พบทะเบียนส่ง" };
  }

  const { user: bookUser, scope: bookScope } = await requireBookWriteAccess();
  if (bookScope.kind !== "district") {
    return { ok: false as const, message: "เฉพาะระดับเขต" };
  }

  const { scope: regScope } = await requireBookregisterWriteScope();
  if (regScope.kind !== "district") {
    return { ok: false as const, message: "เฉพาะระดับเขต" };
  }

  const send = await getDistrictSend(registerSendId, regScope);
  if (!send) {
    return { ok: false as const, message: "ไม่พบทะเบียนส่ง" };
  }
  if (send.forwardedToSchools) {
    return { ok: false as const, message: "ส่งต่อโรงเรียนแล้ว" };
  }

  const schoolIds = formData
    .getAll("schoolIds")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);

  const parsed = forwardSchema.safeParse({
    recipientMode: formData.get("recipientMode"),
    groupId: formData.get("groupId") || undefined,
    schoolIds,
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  const result = await forwardRegisterSendToBook({
    registerSendId,
    recipientMode: parsed.data.recipientMode,
    schoolIds: parsed.data.schoolIds,
    groupId: parsed.data.groupId,
    user: {
      id: Number(bookUser.id),
      personId: bookUser.personId,
      officeCode: bookUser.officeCode,
    },
  });

  if (!result.ok) return result;

  revalidatePath(SEND_PATH);
  revalidatePath(`${SEND_PATH}/${registerSendId}`);
  revalidatePath(BOOK_SENT_PATH);
  revalidatePath(`/modules/book/${result.bookDocId}`);

  return { ok: true as const, bookDocId: result.bookDocId };
}
