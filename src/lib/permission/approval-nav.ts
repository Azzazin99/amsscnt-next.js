import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { permissionPersonSettings } from "@/lib/db/schema";
import { isPermissionModuleAdmin } from "@/lib/permission/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

async function isConfiguredAsGroupPerson(personId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: permissionPersonSettings.id })
    .from(permissionPersonSettings)
    .where(eq(permissionPersonSettings.groupPersonId, personId))
    .limit(1);
  return Boolean(row);
}

async function isConfiguredAsGrantPerson(personId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: permissionPersonSettings.id })
    .from(permissionPersonSettings)
    .where(eq(permissionPersonSettings.grantPersonId, personId))
    .limit(1);
  return Boolean(row);
}

export async function canAccessBasicApprovalInbox(
  user: AmssSessionUser,
): Promise<boolean> {
  if (isPermissionModuleAdmin(user)) return true;
  return isConfiguredAsGroupPerson(user.personId);
}

export async function canAccessGrantApprovalInbox(
  user: AmssSessionUser,
): Promise<boolean> {
  if (isPermissionModuleAdmin(user)) return true;
  return isConfiguredAsGrantPerson(user.personId);
}

export type PermissionApprovalNavFlags = {
  showBasic: boolean;
  showGrant: boolean;
};

export async function resolvePermissionApprovalNavFlags(
  user: AmssSessionUser,
): Promise<PermissionApprovalNavFlags> {
  const [showBasic, showGrant] = await Promise.all([
    canAccessBasicApprovalInbox(user),
    canAccessGrantApprovalInbox(user),
  ]);
  return { showBasic, showGrant };
}
