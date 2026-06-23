import { z } from "zod";

export const moduleAdminCreateSchema = z.object({
  userId: z.coerce.number().int().positive("กรุณาเลือกผู้ใช้"),
  moduleSlug: z.string().trim().min(1, "กรุณาเลือกโมดูล"),
});

export type ModuleAdminCreateInput = z.infer<typeof moduleAdminCreateSchema>;
