import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { districtSettings } from "@/lib/db/schema";

export type DistrictSettingsRow = {
  id: number;
  officeName: string;
  officeCode: string;
  updatedAt: Date;
};

export async function getDistrictSettingsRow(): Promise<DistrictSettingsRow | null> {
  const [row] = await db
    .select({
      id: districtSettings.id,
      officeName: districtSettings.officeName,
      officeCode: districtSettings.officeCode,
      updatedAt: districtSettings.updatedAt,
    })
    .from(districtSettings)
    .orderBy(asc(districtSettings.id))
    .limit(1);

  return row ?? null;
}
