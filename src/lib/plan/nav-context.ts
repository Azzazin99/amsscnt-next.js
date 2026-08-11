import type { PlanNavContext } from "@/lib/plan/nav-config";
import {
  canAddPlan,
  canOperatePlanData,
  isDistrictPlanUser,
  isPlanModuleAdmin,
} from "@/lib/plan/permissions";
import type { PlanPermissionFlags } from "@/lib/plan/permissions";
import type { AmssSessionUser } from "@/types/next-auth";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

export function buildPlanNavContext(
  user: AmssSessionUser,
  perms: PlanPermissionFlags,
  settingsNavMode: ModuleSettingsNavMode,
): PlanNavContext {
  const districtUser = isDistrictPlanUser(user.loginStatus);
  const showDistrictMenus = districtUser && canOperatePlanData(user, perms);

  return {
    settingsNavMode,
    canOperate: canOperatePlanData(user, perms),
    canAdd: canAddPlan(user, perms),
    showDistrictMenus,
    // legacy: รายงาน #2–#5 แสดงเมื่อ login_status <= 4 ไม่ต้องมี mpms_*
    showDistrictReports:
      isPlanModuleAdmin(user) ||
      (user.organizationType === "district" && districtUser),
  };
}
