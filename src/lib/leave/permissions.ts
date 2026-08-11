import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leavePermissions } from "@/lib/db/schema";
import type { ApprovalStep } from "@/lib/leave/regulation/approval-chain";
import type { AmssSessionUser } from "@/types/next-auth";

export type LeavePermissionFlags = {
  p1: number;
  p2: number;
  officerPersonId: string | null;
};

export async function getLeavePermissions(
  userId: number,
): Promise<LeavePermissionFlags> {
  const [row] = await db
    .select()
    .from(leavePermissions)
    .where(eq(leavePermissions.userId, userId))
    .limit(1);

  return {
    p1: row?.p1 ?? 0,
    p2: row?.p2 ?? 0,
    officerPersonId: row?.officerPersonId ?? null,
  };
}

export function isLeaveModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("leave")
  );
}

export function isDistrictLeaveUser(loginStatus: number): boolean {
  return loginStatus === 99 || (loginStatus >= 2 && loginStatus <= 4);
}

export function isSchoolLaUser(loginStatus: number): boolean {
  return loginStatus >= 12 && loginStatus <= 15;
}

export function canViewLeaveList(
  user: AmssSessionUser,
  perms: LeavePermissionFlags,
): boolean {
  if (isLeaveModuleAdmin(user)) return true;
  if (perms.p1 === 1 || perms.p2 === 1) return true;
  if (user.organizationType === "district") {
    return isDistrictLeaveUser(user.loginStatus);
  }
  return user.organizationType === "school" && isSchoolLaUser(user.loginStatus);
}

export function canManageLeaveSettings(
  user: AmssSessionUser,
  perms: LeavePermissionFlags,
): boolean {
  return isLeaveModuleAdmin(user) || perms.p1 === 1;
}

export const canManageLeaveStaffPermissions = isLeaveModuleAdmin;

export function canWriteLeaveRequest(
  user: AmssSessionUser,
  perms: LeavePermissionFlags,
): boolean {
  if (isLeaveModuleAdmin(user)) return true;
  if (perms.p2 === 1) return true;
  if (user.organizationType === "school") {
    return user.loginStatus >= 12 && user.loginStatus <= 14;
  }
  return isDistrictLeaveUser(user.loginStatus);
}

export function canApproveLeave(
  user: AmssSessionUser,
  perms: LeavePermissionFlags,
): boolean {
  return isLeaveModuleAdmin(user) || perms.p1 === 1;
}

export type LeavePersonSigners = {
  officerPersonId: string | null;
  commentPersonId: string | null;
  commentPerson2Id: string | null;
  grantPersonId: string | null;
};

export function canApproveLeaveStep(
  user: AmssSessionUser,
  perms: LeavePermissionFlags,
  step: ApprovalStep,
  signers: LeavePersonSigners,
  options?: {
    isSchoolPersonnelRequest?: boolean;
  },
): boolean {
  if (isLeaveModuleAdmin(user) || perms.p1 === 1) return true;

  if (step === "group" && signers.commentPersonId === user.personId) {
    return true;
  }
  if (
    step === "group2" &&
    !options?.isSchoolPersonnelRequest &&
    signers.commentPerson2Id === user.personId
  ) {
    return true;
  }
  if (
    step === "commander" &&
    options?.isSchoolPersonnelRequest &&
    signers.grantPersonId === user.personId
  ) {
    return true;
  }

  return false;
}
