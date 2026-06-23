import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canManageMailSettings,
  canViewMailList,
  canWriteMail,
  getMailPermissions,
  type MailPermissionFlags,
} from "@/lib/mail/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export async function requireMailScope(): Promise<{
  user: AmssSessionUser;
  perms: MailPermissionFlags;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getMailPermissions(Number(session.user.id));
  if (!canViewMailList(session.user, perms)) {
    redirect("/home");
  }

  return { user: session.user, perms };
}

export async function requireMailWriteAccess() {
  const ctx = await requireMailScope();
  if (!canWriteMail(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์ส่งหนังสือเวียน");
  }
  return ctx;
}

export async function requireMailSettingsAccess() {
  const ctx = await requireMailScope();
  if (!canManageMailSettings(ctx.user)) {
    redirect("/modules/mail/inbox");
  }
  return ctx;
}
