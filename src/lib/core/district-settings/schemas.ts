import { z } from "zod";

export const districtSettingsFormSchema = z.object({
  officeName: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อหน่วยงาน")
    .max(255, "ชื่อหน่วยงานยาวเกินไป"),
  officeCode: z
    .string()
    .trim()
    .min(1, "กรุณากรอกรหัสเขตพื้นที่")
    .max(10, "รหัสเขตพื้นที่ยาวเกินไป")
    .regex(/^\d+$/, "รหัสเขตพื้นที่ต้องเป็นตัวเลข"),
});

export type DistrictSettingsFormInput = z.infer<
  typeof districtSettingsFormSchema
>;
