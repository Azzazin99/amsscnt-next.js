import type { BudgetNavContext } from "@/lib/budget/nav-config";
import type { BudgetPermissionFlags } from "@/lib/budget/permissions";
import {
  canChangeBudgetStatus,
  canManageBudgetAllocation,
  canManageBudgetDeega,
  canManageBudgetSettingsData,
  canPayCheckBudget,
  canReceiveBudgetByKind,
  canViewBudgetChecks,
  canViewBudgetWideReports,
  canWithdrawBudget,
  canWriteBudgetPay,
  isBudgetModuleAdmin,
  isDistrictBudgetUser,
} from "@/lib/budget/permissions";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export function buildBudgetNavContext(
  user: AmssSessionUser,
  perms: BudgetPermissionFlags,
  settingsNavMode: ModuleSettingsNavMode,
): BudgetNavContext {
  const district = isDistrictBudgetUser(user.loginStatus);
  const admin = isBudgetModuleAdmin(user);

  return {
    settingsNavMode,
    showStaffMenus: admin,
    canSettings: canManageBudgetSettingsData(user, perms),
    canAllocation: canManageBudgetAllocation(user, perms),
    canReceiveBudget: district && canReceiveBudgetByKind(user, perms, "budget"),
    canReceiveExtra: district && canReceiveBudgetByKind(user, perms, "extra"),
    canReceiveIncome: district && canReceiveBudgetByKind(user, perms, "income"),
    canWithdraw: district && canWithdrawBudget(user, perms),
    canDeega: district && canManageBudgetDeega(user, perms),
    canPayBudget: district && canWriteBudgetPay(user, perms, "budget"),
    canPayExtra: district && canWriteBudgetPay(user, perms, "extra"),
    canPayIncome: district && canWriteBudgetPay(user, perms, "income"),
    canPayReserve: district && canWriteBudgetPay(user, perms, "reserve"),
    canPayCheck: district && canPayCheckBudget(user, perms),
    canChangeBudget: district && canChangeBudgetStatus(user, perms, "budget"),
    canChangeExtra: district && canChangeBudgetStatus(user, perms, "extra"),
    canChangeIncome: district && canChangeBudgetStatus(user, perms, "income"),
    canChecks: district && canViewBudgetChecks(user, perms),
    showWideReports: canViewBudgetWideReports(user),
    showDebtReports: user.loginStatus <= 5,
  };
}
