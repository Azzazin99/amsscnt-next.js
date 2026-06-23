import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canViewAllCompletedReports,
  canViewIdocument,
  canViewIdocumentInbox,
  canWriteIdocument,
} from "@/lib/idocument/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export async function requireIdocumentScope(): Promise<{
  user: AmssSessionUser;
  canWrite: boolean;
  canViewInbox: boolean;
  canViewAllReports: boolean;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!(await canViewIdocument(session.user))) {
    redirect("/home");
  }

  const canWrite = canWriteIdocument(session.user);
  const canViewInbox = await canViewIdocumentInbox(session.user);
  const canViewAllReports = await canViewAllCompletedReports(session.user);

  return {
    user: session.user,
    canWrite,
    canViewInbox,
    canViewAllReports,
  };
}

export async function requireIdocumentWriteAccess() {
  const ctx = await requireIdocumentScope();
  if (!ctx.canWrite) {
    throw new Error("ไม่มีสิทธิ์บันทึกข้อความ");
  }
  return ctx;
}

export async function requireIdocumentInboxAccess() {
  const ctx = await requireIdocumentScope();
  if (!ctx.canViewInbox) {
    redirect("/modules/idocument");
  }
  return ctx;
}
