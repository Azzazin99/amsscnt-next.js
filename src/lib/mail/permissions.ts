import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mailPermissions } from "@/lib/db/schema";
import type { AmssSessionUser } from "@/types/next-auth";

export type MailPermissionFlags = {
  p1: number;
  officerPersonId: string | null;
};

export async function getMailPermissions(
  userId: number,
): Promise<MailPermissionFlags> {
  const [row] = await db
    .select()
    .from(mailPermissions)
    .where(eq(mailPermissions.userId, userId))
    .limit(1);

  return {
    p1: row?.p1 ?? 0,
    officerPersonId: row?.officerPersonId ?? null,
  };
}

export function isMailModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("mail")
  );
}

/** legacy: login_status <= 14 ใช้ไปรษณีย์ได้ */
export function isMailUser(loginStatus: number): boolean {
  return loginStatus <= 14;
}

export function canViewMailList(
  user: AmssSessionUser,
  perms: MailPermissionFlags,
): boolean {
  if (isMailModuleAdmin(user)) return true;
  if (perms.p1 === 1) return true;
  return isMailUser(user.loginStatus);
}

export function canWriteMail(
  user: AmssSessionUser,
  perms: MailPermissionFlags,
): boolean {
  if (isMailModuleAdmin(user)) return true;
  if (perms.p1 === 1) return true;
  return isMailUser(user.loginStatus);
}

export function canManageMailSettings(user: AmssSessionUser): boolean {
  return isMailModuleAdmin(user);
}
