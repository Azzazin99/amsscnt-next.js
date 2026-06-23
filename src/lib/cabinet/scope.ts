import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  canManageCabinetSettings,
  canUploadCabinet,
  canViewCabinetList,
  getCabinetPermissions,
  type CabinetPermissionFlags,
} from "@/lib/cabinet/permissions";
import type { AmssSessionUser } from "@/types/next-auth";

export async function requireCabinetScope(): Promise<{
  user: AmssSessionUser;
  perms: CabinetPermissionFlags;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getCabinetPermissions(Number(session.user.id));
  if (!canViewCabinetList(session.user, perms)) {
    redirect("/home");
  }

  return { user: session.user, perms };
}

export async function requireCabinetUploadAccess() {
  const ctx = await requireCabinetScope();
  if (!canUploadCabinet(ctx.user, ctx.perms)) {
    throw new Error("ไม่มีสิทธิ์อัปโหลดเอกสาร");
  }
  return ctx;
}

export async function requireCabinetSettingsAccess() {
  const ctx = await requireCabinetScope();
  if (!canManageCabinetSettings(ctx.user, ctx.perms)) {
    redirect("/modules/cabinet");
  }
  return ctx;
}
