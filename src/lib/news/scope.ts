import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canManageNewsSettings,
  canViewNewsList,
  canWriteNews,
  getNewsPermissions,
  type NewsPermissionFlags,
} from "@/lib/news/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export async function requireNewsScope(): Promise<{
  user: AmssSessionUser;
  perms: NewsPermissionFlags;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getNewsPermissions(Number(session.user.id));
  if (!canViewNewsList(session.user, perms)) {
    redirect("/home");
  }

  return { user: session.user, perms };
}

export async function requireNewsWriteAccess() {
  const ctx = await requireNewsScope();
  if (!canWriteNews(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์บันทึกข่าว");
  }
  return ctx;
}

export async function requireNewsSettingsAccess() {
  const ctx = await requireNewsScope();
  if (!canManageNewsSettings(ctx.user)) {
    redirect("/modules/news");
  }
  return ctx;
}
