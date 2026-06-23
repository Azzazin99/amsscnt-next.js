import { asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { registerOfficeNumbers } from "@/lib/db/schema";

export type DistrictOfficeNoRow = {
  id: number;
  officeNo: string;
  recDate: string | null;
};

/** แถวเลขที่สำนักงานเขต (school_code ว่าง) — แถวแรกที่ใช้สร้างทะเบียนส่ง */
export async function getDistrictOfficeNumberRow(): Promise<DistrictOfficeNoRow | null> {
  const [row] = await db
    .select({
      id: registerOfficeNumbers.id,
      officeNo: registerOfficeNumbers.officeNo,
      recDate: registerOfficeNumbers.recDate,
    })
    .from(registerOfficeNumbers)
    .where(isNull(registerOfficeNumbers.schoolCode))
    .orderBy(asc(registerOfficeNumbers.id))
    .limit(1);

  return row ?? null;
}

export async function getDistrictOfficeNo(): Promise<string> {
  const row = await getDistrictOfficeNumberRow();
  return row?.officeNo ?? "";
}

export async function getSchoolOfficeNo(schoolCode: string): Promise<string> {
  const [row] = await db
    .select({ officeNo: registerOfficeNumbers.officeNo })
    .from(registerOfficeNumbers)
    .where(eq(registerOfficeNumbers.schoolCode, schoolCode))
    .orderBy(asc(registerOfficeNumbers.id))
    .limit(1);

  return row?.officeNo ?? "";
}

export async function listDistrictOfficeNumbers(): Promise<DistrictOfficeNoRow[]> {
  return db
    .select({
      id: registerOfficeNumbers.id,
      officeNo: registerOfficeNumbers.officeNo,
      recDate: registerOfficeNumbers.recDate,
    })
    .from(registerOfficeNumbers)
    .where(isNull(registerOfficeNumbers.schoolCode))
    .orderBy(asc(registerOfficeNumbers.id));
}
