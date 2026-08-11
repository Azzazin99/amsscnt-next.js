import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { meetingPermissions } from "@/lib/db/schema";
import type { AmssSessionUser } from "@/types/next-auth";

export type MeetingPermissionFlags = {
  p1: number;
  officerPersonId: string | null;
};

export async function getMeetingPermissions(
  userId: number,
): Promise<MeetingPermissionFlags> {
  const [row] = await db
    .select()
    .from(meetingPermissions)
    .where(eq(meetingPermissions.userId, userId))
    .limit(1);

  return {
    p1: row?.p1 ?? 0,
    officerPersonId: row?.officerPersonId ?? null,
  };
}

export function isMeetingModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("meeting")
  );
}

export function isDistrictMeetingUser(loginStatus: number): boolean {
  return loginStatus === 99 || (loginStatus >= 2 && loginStatus <= 4);
}

export function canViewMeetingList(
  user: AmssSessionUser,
  perms: MeetingPermissionFlags,
): boolean {
  if (isMeetingModuleAdmin(user)) return true;
  if (perms.p1 === 1) return true;
  return (
    user.organizationType === "district" &&
    isDistrictMeetingUser(user.loginStatus)
  );
}

export function canBookMeeting(
  user: AmssSessionUser,
  perms: MeetingPermissionFlags,
): boolean {
  return canViewMeetingList(user, perms);
}

export function canManageMeetingSettings(
  user: AmssSessionUser,
): boolean {
  return isMeetingModuleAdmin(user);
}

export const canManageMeetingStaffPermissions = isMeetingModuleAdmin;

export function canApproveMeeting(
  user: AmssSessionUser,
  perms: MeetingPermissionFlags,
): boolean {
  return isMeetingModuleAdmin(user) || perms.p1 === 1;
}
