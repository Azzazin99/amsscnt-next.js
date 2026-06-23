import { z } from "zod";

export const workgroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อกลุ่มงาน")
    .max(255, "ชื่อกลุ่มงานยาวเกินไป"),
  sortOrder: z.coerce
    .number()
    .int("ลำดับต้องเป็นจำนวนเต็ม")
    .min(0, "ลำดับต้องไม่ติดลบ")
    .max(9999, "ลำดับเกินกำหนด"),
  active: z.preprocess(
    (val) => val === "on" || val === "true" || val === true || val === "1",
    z.boolean(),
  ),
});

export type WorkgroupInput = z.infer<typeof workgroupSchema>;
