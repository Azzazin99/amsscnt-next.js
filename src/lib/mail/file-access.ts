import "server-only";

import { auth } from "@/auth";
import { canViewMailList, getMailPermissions } from "@/lib/mail/permissions";
import {
  canViewMailDocument,
  getMailDocument,
} from "@/lib/mail/queries";

export async function requireMailFileAccess(documentId: number) {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }

  const perms = await getMailPermissions(Number(session.user.id));
  if (!canViewMailList(session.user, perms)) {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }

  const doc = await getMailDocument(documentId);
  if (!doc) {
    return { ok: false as const, status: 404, message: "Not found" };
  }

  const canView = await canViewMailDocument(doc, session.user.personId);
  if (!canView) {
    return { ok: false as const, status: 404, message: "Not found" };
  }

  const isSender = doc.senderPersonId === session.user.personId;

  return {
    ok: true as const,
    user: session.user,
    perms,
    doc,
    isSender,
  };
}
