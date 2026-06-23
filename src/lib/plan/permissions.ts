import type { AmssSessionUser } from "@/types/next-auth";

export function isPlanModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("plan")
  );
}

export function isDistrictPlanUser(loginStatus: number): boolean {
  return loginStatus === 99 || (loginStatus >= 2 && loginStatus <= 4);
}

export function canViewPlan(user: AmssSessionUser): boolean {
  if (isPlanModuleAdmin(user)) return true;
  return (
    user.organizationType === "district" && isDistrictPlanUser(user.loginStatus)
  );
}

export function canManagePlanSettings(user: AmssSessionUser): boolean {
  return isPlanModuleAdmin(user);
}

export function canWritePlan(user: AmssSessionUser): boolean {
  return canViewPlan(user);
}
