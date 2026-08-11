import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AmssSessionUser } from "@/types/next-auth";

export type ModuleSettingsNavMode = "full" | "limited" | "none";

/** จัดการระบบ — smss_admin / super admin (เทียบ legacy) */
export function canAccessSystemAdmin(user: AmssSessionUser): boolean {
  return user.isSuperAdmin || user.isAdmin;
}

export async function requireSystemAdmin(): Promise<AmssSessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canAccessSystemAdmin(session.user)) redirect("/home");
  return session.user;
}

export function getModuleSettingsNavMode(
  user: AmssSessionUser,
  moduleKey?: string,
): ModuleSettingsNavMode {
  if (user.isSuperAdmin || user.isAdmin) return "full";
  if (moduleKey && user.moduleAdmins.includes(moduleKey)) return "limited";
  return "none";
}

export function canAccessSuperAdmin(user: AmssSessionUser): boolean {
  return user.isSuperAdmin;
}

export async function requireSuperAdmin(): Promise<AmssSessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canAccessSuperAdmin(session.user)) redirect("/home");
  return session.user;
}
