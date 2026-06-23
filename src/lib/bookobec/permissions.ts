import { getAccessibleModules } from "@/lib/modules/get-app-menu";
import type { AmssSessionUser } from "@/types/next-auth";

export function isBookobecModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("bookobec")
  );
}

export async function canViewBookobec(
  user: AmssSessionUser,
): Promise<boolean> {
  if (isBookobecModuleAdmin(user)) return true;
  const accessible = await getAccessibleModules(user);
  return accessible.some((m) => m.slug === "bookobec");
}
