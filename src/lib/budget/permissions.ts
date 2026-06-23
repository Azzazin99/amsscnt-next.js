import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { budgetPermissions } from "@/lib/db/schema";
import type { AmssSessionUser } from "@/types/next-auth";

export type BudgetPermissionFlags = {
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  p5: number;
  p6: number;
  p7: number;
  p8: number;
  p9: number;
  p10: number;
};

const EMPTY_FLAGS: BudgetPermissionFlags = {
  p1: 0,
  p2: 0,
  p3: 0,
  p4: 0,
  p5: 0,
  p6: 0,
  p7: 0,
  p8: 0,
  p9: 0,
  p10: 0,
};

export async function getBudgetPermissions(
  personId: string,
): Promise<BudgetPermissionFlags> {
  const [row] = await db
    .select()
    .from(budgetPermissions)
    .where(eq(budgetPermissions.personId, personId))
    .limit(1);

  if (!row) return EMPTY_FLAGS;

  return {
    p1: row.p1,
    p2: row.p2,
    p3: row.p3,
    p4: row.p4,
    p5: row.p5,
    p6: row.p6,
    p7: row.p7,
    p8: row.p8,
    p9: row.p9,
    p10: row.p10,
  };
}

export function isBudgetModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("budget")
  );
}

export function isDistrictBudgetUser(loginStatus: number): boolean {
  return loginStatus === 99 || (loginStatus >= 2 && loginStatus <= 4);
}

export function canViewBudget(
  user: AmssSessionUser,
  _perms: BudgetPermissionFlags,
): boolean {
  if (isBudgetModuleAdmin(user)) return true;
  return (
    user.organizationType === "district" && isDistrictBudgetUser(user.loginStatus)
  );
}

export function canManageBudgetSettings(
  user: AmssSessionUser,
  perms: BudgetPermissionFlags,
): boolean {
  return isBudgetModuleAdmin(user) || perms.p2 === 1;
}

export function canWriteBudgetReceive(
  user: AmssSessionUser,
  perms: BudgetPermissionFlags,
): boolean {
  return isBudgetModuleAdmin(user) || perms.p5 === 1;
}

export function canWriteBudgetDisburse(
  user: AmssSessionUser,
  perms: BudgetPermissionFlags,
): boolean {
  return isBudgetModuleAdmin(user) || perms.p5 === 1;
}
