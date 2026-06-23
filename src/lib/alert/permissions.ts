import { getAccessibleModules } from "@/lib/modules/get-app-menu";
import type { AmssSessionUser } from "@/types/next-auth";

export function isAlertModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("alert")
  );
}

export async function canViewAlert(user: AmssSessionUser): Promise<boolean> {
  if (isAlertModuleAdmin(user)) return true;
  const accessible = await getAccessibleModules(user);
  return accessible.some((m) => m.slug === "alert");
}
