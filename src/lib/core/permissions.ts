import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AmssSessionUser } from "@/types/next-auth";

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
