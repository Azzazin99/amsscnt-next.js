import { z } from "zod";

export const bookGroupSchema = z.object({
  name: z.string().trim().min(1, "กรุณาระบุชื่อกลุ่ม").max(255),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  schoolIds: z.array(z.coerce.number().int().positive()).default([]),
});
