import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canBookMeeting,
  canViewMeetingList,
  getMeetingPermissions,
  type MeetingPermissionFlags,
} from "@/lib/meeting/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export async function requireMeetingScope(): Promise<{
  user: AmssSessionUser;
  perms: MeetingPermissionFlags;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getMeetingPermissions(Number(session.user.id));
  if (!canViewMeetingList(session.user, perms)) {
    redirect("/home");
  }

  return { user: session.user, perms };
}

export async function requireMeetingWriteAccess() {
  const ctx = await requireMeetingScope();
  if (!canBookMeeting(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์จองห้องประชุม");
  }
  return ctx;
}
