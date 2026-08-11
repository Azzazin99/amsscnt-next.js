import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canViewBudget,
  getBudgetPermissions,
  type BudgetPermissionFlags,
} from "@/lib/budget/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export async function requireBudgetAccess(
  _kind?: string,
): Promise<{
  user: AmssSessionUser;
  perms: BudgetPermissionFlags;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBudgetPermissions(session.user.personId);
  if (!canViewBudget(session.user, perms)) redirect("/home");

  return { user: session.user, perms };
}

export const requireBudgetAllocationAccess = requireBudgetAccess;
export const requireBudgetDeegaAccess = requireBudgetAccess;
export const requireBudgetPayAccess = requireBudgetAccess;
export const requireBudgetPayCheckAccess = requireBudgetAccess;
export const requireBudgetReceiveAccess = requireBudgetAccess;
export const requireBudgetStatusChangeAccess = requireBudgetAccess;
export const requireBudgetWithdrawAccess = requireBudgetAccess;
export const requireBudgetSettingsData = requireBudgetAccess;
export const requireBudgetStaffAccess = requireBudgetAccess;
