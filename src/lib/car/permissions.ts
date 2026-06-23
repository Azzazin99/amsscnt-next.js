import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { carPermissions } from "@/lib/db/schema";
import type { AmssSessionUser } from "@/types/next-auth";

export type CarPermissionFlags = {
  p1: number;
  officerPersonId: string | null;
};

export async function getCarPermissions(
  userId: number,
): Promise<CarPermissionFlags> {
  const [row] = await db
    .select()
    .from(carPermissions)
    .where(eq(carPermissions.userId, userId))
    .limit(1);

  return {
    p1: row?.p1 ?? 0,
    officerPersonId: row?.officerPersonId ?? null,
  };
}

export function isCarModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("car")
  );
}

export function isDistrictCarUser(loginStatus: number): boolean {
  return loginStatus === 99 || (loginStatus >= 2 && loginStatus <= 4);
}

export function canViewCarList(
  user: AmssSessionUser,
  perms: CarPermissionFlags,
): boolean {
  if (isCarModuleAdmin(user)) return true;
  if (perms.p1 >= 1) return true;
  return (
    user.organizationType === "district" && isDistrictCarUser(user.loginStatus)
  );
}

export function canManageCarSettings(
  user: AmssSessionUser,
  perms: CarPermissionFlags,
): boolean {
  return isCarModuleAdmin(user) || perms.p1 === 1;
}

export function canWriteCarRequest(
  user: AmssSessionUser,
  perms: CarPermissionFlags,
): boolean {
  if (isCarModuleAdmin(user)) return true;
  return (
    user.organizationType === "district" && isDistrictCarUser(user.loginStatus)
  );
}

export function canApproveCar(
  user: AmssSessionUser,
  perms: CarPermissionFlags,
): boolean {
  return isCarModuleAdmin(user) || perms.p1 === 3;
}
