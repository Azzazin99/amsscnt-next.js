import { getDistrictSettingsRow } from "@/lib/core/district-settings/queries";
import type { AmssSessionUser } from "@/types/next-auth";

/** โหลดชื่อหน่วยงานล่าสุดจาก DB (ไม่ต้อง login ใหม่หลังแก้ P012) */
export async function resolveSessionUser(
  user: AmssSessionUser,
): Promise<AmssSessionUser> {
  const district = await getDistrictSettingsRow();
  if (!district) return user;

  return {
    ...user,
    officeName: district.officeName,
    officeCode: district.officeCode,
  };
}
