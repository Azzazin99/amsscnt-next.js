import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leavePersonSettings } from "@/lib/db/schema";
import {
  isLeaveModuleAdmin,
  type LeavePermissionFlags,
} from "@/lib/leave/permissions";
import type { LeaveScope } from "@/lib/leave/scope";
import type { AmssSessionUser } from "@/types/next-auth";

export type LeaveApprovalNavItem = {
  href: string;
  label: string;
};

async function isConfiguredAsCommentPerson(personId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: leavePersonSettings.id })
    .from(leavePersonSettings)
    .where(eq(leavePersonSettings.commentPersonId, personId))
    .limit(1);
  return Boolean(row);
}

async function isConfiguredAsCommentPerson2(
  personId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: leavePersonSettings.id })
    .from(leavePersonSettings)
    .where(eq(leavePersonSettings.commentPerson2Id, personId))
    .limit(1);
  return Boolean(row);
}

async function isConfiguredAsGrantPerson(personId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: leavePersonSettings.id })
    .from(leavePersonSettings)
    .where(eq(leavePersonSettings.grantPersonId, personId))
    .limit(1);
  return Boolean(row);
}

/** Flyout พิจารณาอนุมัติ — ผอ.กลุ่ม → รอง ผอ.สพท. (เขต) / ผอ.สพท. (โรงเรียน) */
export async function resolveLeaveApprovalNavItems(
  user: AmssSessionUser,
  perms: LeavePermissionFlags,
  scope: LeaveScope | null,
): Promise<LeaveApprovalNavItem[]> {
  if (!scope || scope.kind !== "district") return [];

  const items: LeaveApprovalNavItem[] = [];
  const admin = isLeaveModuleAdmin(user);

  if (admin || (await isConfiguredAsCommentPerson(user.personId))) {
    items.push({
      href: "/modules/leave/approvals/group",
      label: "ผอ.กลุ่ม",
    });
  }

  if (admin || (await isConfiguredAsCommentPerson2(user.personId))) {
    items.push({
      href: "/modules/leave/approvals/group2",
      label: "รอง ผอ.สพท. (อนุมัติ)",
    });
  }

  if (admin || (await isConfiguredAsGrantPerson(user.personId))) {
    items.push({
      href: "/modules/leave/approvals/commander",
      label: "ผอ.สพท. (อนุมัติ — โรงเรียน)",
    });
  }

  return items;
}

export async function canAccessGroupApprovalInbox(
  user: AmssSessionUser,
): Promise<boolean> {
  if (isLeaveModuleAdmin(user)) return true;
  return isConfiguredAsCommentPerson(user.personId);
}

export async function canAccessCommanderApprovalInbox(
  user: AmssSessionUser,
): Promise<boolean> {
  if (isLeaveModuleAdmin(user)) return true;
  return isConfiguredAsGrantPerson(user.personId);
}

export async function canAccessGroup2ApprovalInbox(
  user: AmssSessionUser,
): Promise<boolean> {
  if (isLeaveModuleAdmin(user)) return true;
  return isConfiguredAsCommentPerson2(user.personId);
}

export async function canAccessGroup2CancellationApprovalInbox(
  user: AmssSessionUser,
): Promise<boolean> {
  return canAccessGroup2ApprovalInbox(user);
}

export async function canAccessGroupCancellationApprovalInbox(
  user: AmssSessionUser,
): Promise<boolean> {
  return canAccessGroupApprovalInbox(user);
}

export async function canAccessCommanderCancellationApprovalInbox(
  user: AmssSessionUser,
): Promise<boolean> {
  return canAccessCommanderApprovalInbox(user);
}

export async function resolveLeaveCancellationApprovalNavItems(
  user: AmssSessionUser,
  perms: LeavePermissionFlags,
  scope: LeaveScope | null,
): Promise<LeaveApprovalNavItem[]> {
  return resolveLeaveApprovalNavItems(user, perms, scope);
}

