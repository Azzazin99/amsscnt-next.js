import { insertAndGetId } from "../db/helpers";
import "server-only";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { mailRecipients } from "@/lib/db/schema";

const INBOX_PATH = "/modules/mail/inbox";

export async function acknowledgeMailRecipient(
  refId: string,
  personId: string,
  documentId: number,
): Promise<boolean> {
  const [res] = await db
    .update(mailRecipients)
    .set({ answered: true, answeredAt: new Date() })
    .where(
      and(
        eq(mailRecipients.refId, refId),
        eq(mailRecipients.sendTo, personId),
        eq(mailRecipients.answered, false),
      ),
    );

  if (res.affectedRows === 0) return false;

  revalidatePath(INBOX_PATH);
  revalidatePath(`/modules/mail/${documentId}`);
  return true;
}
