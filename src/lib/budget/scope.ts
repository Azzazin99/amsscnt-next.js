import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canViewBudget,
  getBudgetPermissions,
  type BudgetPermissionFlags,
} from "@/lib/budget/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export async function requireBudgetAccess(): Promise<{
  user: AmssSessionUser;
  perms: BudgetPermissionFlags;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getBudgetPermissions(session.user.personId);
  if (!canViewBudget(session.user, perms)) redirect("/home");

  return { user: session.user, perms };
}
