import { z } from "zod";

export const moduleUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อโมดูล")
    .max(255, "ชื่อโมดูลยาวเกินไป"),
  sortOrder: z.coerce
    .number()
    .int()
    .min(0, "ลำดับต้องไม่ติดลบ")
    .max(9999, "ลำดับเกินกำหนด"),
  active: z.preprocess(
    (val) => val === "on" || val === "true" || val === true || val === "1",
    z.boolean(),
  ),
});

export type ModuleUpdateInput = z.infer<typeof moduleUpdateSchema>;
