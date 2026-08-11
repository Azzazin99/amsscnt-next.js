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
  perms?: unknown,
): Promise<boolean> {
  if (isBookobecModuleAdmin(user)) return true;
  const accessible = await getAccessibleModules(user);
  return accessible.some((m) => m.slug === "bookobec");
}

export type BookobecPermissionFlags = {
  permAdd: boolean;
  permEdit: boolean;
  permDele: boolean;
  p1: number;
  p2: number;
};

export async function getBookobecPermissions(
  userId: number | string,
): Promise<BookobecPermissionFlags> {
  return {
    permAdd: true,
    permEdit: true,
    permDele: true,
    p1: 1,
    p2: 1,
  };
}

export function canManageBookobecStaffPermissions(
  user: AmssSessionUser,
): boolean {
  return isBookobecModuleAdmin(user);
}
