import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canViewBookobec,
  getBookobecPermissions,
  type BookobecPermissionFlags,
} from "@/lib/bookobec/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export async function requireBookobecScope(): Promise<{
  user: AmssSessionUser;
  perms: BookobecPermissionFlags;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!(await canViewBookobec(session.user))) {
    redirect("/home");
  }

  const perms = await getBookobecPermissions(Number(session.user.id));
  return { user: session.user, perms };
}

export const requireBookobecSettingsAccess = requireBookobecScope;
