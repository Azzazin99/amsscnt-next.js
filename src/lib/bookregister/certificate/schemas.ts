import { z } from "zod";

export const certificateCreateSchema = z.object({
  signdate: z.string().min(1, "กรุณาระบุลงวันที่"),
  subject: z.string().min(1, "กรุณากรอกเรื่อง"),
  comment: z.string().optional(),
  urgencyLevel: z.coerce.number().int().min(1).max(4).default(1),
  secretLevel: z.coerce.number().int().min(0).max(3).default(0),
});

export const certificateUpdateSchema = certificateCreateSchema;

export type CertificateCreateInput = z.infer<typeof certificateCreateSchema>;
export type CertificateUpdateInput = z.infer<
  typeof certificateUpdateSchema
>;

