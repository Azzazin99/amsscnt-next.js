import { z } from "zod";

export const schoolGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อกลุ่มสถานศึกษา")
    .max(255, "ชื่อกลุ่มยาวเกินไป"),
  sortOrder: z.coerce
    .number()
    .int("ลำดับต้องเป็นจำนวนเต็ม")
    .min(0, "ลำดับต้องไม่ติดลบ")
    .max(9999, "ลำดับเกินกำหนด"),
});

export type SchoolGroupInput = z.infer<typeof schoolGroupSchema>;
