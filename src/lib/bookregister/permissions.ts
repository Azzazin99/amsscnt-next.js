import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { registerPermissions } from "@/lib/db/schema";
import type { AmssSessionUser } from "@/types/next-auth";

export type BookregisterPermissionFlags = {
  p1: number;
  p2: number;
  p3: number;
  canViewSecret: number;
};

export async function getBookregisterPermissions(
  userId: number,
): Promise<BookregisterPermissionFlags> {
  const [row] = await db
    .select()
    .from(registerPermissions)
    .where(eq(registerPermissions.userId, userId))
    .limit(1);

  return {
    p1: row?.p1 ?? 0,
    p2: row?.p2 ?? 0,
    p3: row?.p3 ?? 0,
    canViewSecret: row?.canViewSecret ? 1 : 0,
  };
}

/** ดูหนังสือลับ (ชั้นความลับ > 0) — module admin หรือสิทธิ์เฉพาะ */
export function canViewSecretDocuments(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
): boolean {
  return isBookregisterModuleAdmin(user) || perms.canViewSecret === 1;
}

export function canAccessSecretLevel(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
  secretLevel: number,
): boolean {
  if (secretLevel <= 0) return true;
  return canViewSecretDocuments(user, perms);
}

export function isBookregisterModuleAdmin(user: AmssSessionUser): boolean {
  return (
    user.isSuperAdmin ||
    user.isAdmin ||
    user.moduleAdmins.includes("bookregister")
  );
}

/** กำหนดปีปฏิทิน (เขต) — p1 หรือ module admin */
export function canManageDistrictYears(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
): boolean {
  return isBookregisterModuleAdmin(user) || perms.p1 === 1;
}

/** ดู/ใช้ทะเบียนเขต — login_status เขต, p1, หรือ module admin */
export function canViewDistrictRegisters(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
): boolean {
  return (
    isBookregisterModuleAdmin(user) ||
    perms.p1 === 1 ||
    isDistrictBookregisterUser(user.loginStatus)
  );
}

export function isDistrictBookregisterUser(loginStatus: number): boolean {
  return loginStatus === 99 || (loginStatus >= 2 && loginStatus <= 4);
}

export function isSchoolBookregisterUser(loginStatus: number): boolean {
  return loginStatus >= 12 && loginStatus <= 15;
}

/** ดูทะเบียนโรงเรียน — login โรงเรียน (12–15) */
export function canViewSchoolRegisters(user: AmssSessionUser): boolean {
  return (
    user.organizationType === "school" &&
    isSchoolBookregisterUser(user.loginStatus)
  );
}

/** บันทึกทะเบียนโรงเรียน — ผู้บริหาร/ครู (12–14) หรือ p2 */
export function canWriteSchoolRegisters(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
): boolean {
  if (isBookregisterModuleAdmin(user)) return true;
  if (
    user.organizationType === "school" &&
    user.loginStatus >= 12 &&
    user.loginStatus <= 14
  ) {
    return true;
  }
  return perms.p2 === 1;
}

/** ลบทะเบียนโรงเรียน — เหมือนเขต: p3 หรือ module admin */
export function canDeleteSchoolRegisters(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
): boolean {
  return isBookregisterModuleAdmin(user) || perms.p3 === 1;
}

export function canDeleteRegisters(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
  scope: import("@/lib/bookregister/scope").BookregisterScope,
): boolean {
  if (scope.kind === "district") {
    return canDeleteDistrictRegisters(user, perms);
  }
  return canDeleteSchoolRegisters(user, perms);
}

export function canViewRegisters(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
): boolean {
  return canViewDistrictRegisters(user, perms) || canViewSchoolRegisters(user);
}

/** บันทึก / แก้ไขทะเบียน — p2 หรือ module admin */
export function canWriteDistrictRegisters(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
): boolean {
  return isBookregisterModuleAdmin(user) || perms.p2 === 1;
}

/** ลบทะเบียน — p3 หรือ module admin */
export function canDeleteDistrictRegisters(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
): boolean {
  return isBookregisterModuleAdmin(user) || perms.p3 === 1;
}

/** แก้ไข/ลบได้ภายใน 1 วันหลังวันลงทะเบียน (ตาม legacy) */
export function isWithinReceiveModifyWindow(
  registerDate: string | null | undefined,
): boolean {
  if (!registerDate) return false;
  const reg = new Date(`${registerDate.slice(0, 10)}T00:00:00+07:00`);
  if (Number.isNaN(reg.getTime())) return false;
  const deadline = new Date(reg);
  deadline.setDate(deadline.getDate() + 1);
  return Date.now() < deadline.getTime();
}

export function canModifyOwnReceiveRecord(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
  officerId: number | null,
  registerDate: string | null,
): boolean {
  if (!isWithinReceiveModifyWindow(registerDate)) return false;
  if (isBookregisterModuleAdmin(user)) return true;
  return officerId === Number(user.id);
}

/** แก้ไข/ลบทะเบียนส่งได้ภายใน 3 เดือนหลังวันลงทะเบียน (ตาม legacy 7776000 วินาที) */
export function isWithinSendModifyWindow(
  registerDate: string | null | undefined,
): boolean {
  if (!registerDate) return false;
  const reg = new Date(`${registerDate.slice(0, 10)}T00:00:00+07:00`);
  if (Number.isNaN(reg.getTime())) return false;
  const deadline = new Date(reg);
  deadline.setDate(deadline.getDate() + 90);
  return Date.now() < deadline.getTime();
}

export function canModifyOwnSendRecord(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
  officerId: number | null,
  registerDate: string | null,
): boolean {
  if (!isWithinSendModifyWindow(registerDate)) return false;
  if (isBookregisterModuleAdmin(user)) return true;
  return officerId === Number(user.id);
}

/** แก้ไข/ลบทะเบียนคำสั่งได้ภายใน 50 วันหลังวันลงทะเบียน (ตาม legacy 86400×50) */
export function isWithinCommandModifyWindow(
  registerDate: string | null | undefined,
): boolean {
  if (!registerDate) return false;
  const reg = new Date(`${registerDate.slice(0, 10)}T00:00:00+07:00`);
  if (Number.isNaN(reg.getTime())) return false;
  const deadline = new Date(reg);
  deadline.setDate(deadline.getDate() + 50);
  return Date.now() < deadline.getTime();
}

/** แก้ไขคำสั่ง — ผู้บันทึก หรือ p1 ภายในหน้าต่างเวลา */
export function canEditCommandRecord(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
  officerId: number | null,
  registerDate: string | null,
): boolean {
  if (!isWithinCommandModifyWindow(registerDate)) return false;
  if (isBookregisterModuleAdmin(user)) return true;
  if (perms.p1 === 1) return true;
  return officerId === Number(user.id);
}

/** ลบคำสั่ง — เฉพาะผู้บันทึกภายในหน้าต่างเวลา */
export function canDeleteCommandRecord(
  user: AmssSessionUser,
  perms: BookregisterPermissionFlags,
  officerId: number | null,
  registerDate: string | null,
): boolean {
  if (!isWithinCommandModifyWindow(registerDate)) return false;
  if (isBookregisterModuleAdmin(user)) return true;
  return officerId === Number(user.id);
}
