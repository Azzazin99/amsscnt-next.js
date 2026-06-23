import { getAccessibleModules } from "@/lib/modules/get-app-menu";
import type { AmssSessionUser } from "@/types/next-auth";

export function isQuestionnaireModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("questionnaire")
  );
}

export async function canViewQuestionnaire(
  user: AmssSessionUser,
): Promise<boolean> {
  if (isQuestionnaireModuleAdmin(user)) return true;
  const accessible = await getAccessibleModules(user);
  return accessible.some((m) => m.slug === "questionnaire");
}
