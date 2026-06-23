import { z } from "zod";

export const commandCreateSchema = z.object({
  signdate: z.string().min(1, "กรุณาระบุสั่ง ณ วันที่"),
  subject: z.string().min(1, "กรุณากรอกเรื่อง"),
  comment: z.string().optional(),
});

export const commandUpdateSchema = commandCreateSchema;

export type CommandCreateInput = z.infer<typeof commandCreateSchema>;
export type CommandUpdateInput = z.infer<typeof commandUpdateSchema>;
