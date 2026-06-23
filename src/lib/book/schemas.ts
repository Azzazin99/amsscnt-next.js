import { z } from "zod";

export const bookCreateSchema = z.object({
  bookNo: z.string().trim().min(1, "กรุณาระบุเลขที่หนังสือ").max(100),
  signDate: z.string().trim().min(1, "กรุณาระบุลงวันที่"),
  subject: z.string().trim().min(1, "กรุณาระบุเรื่อง").max(500),
  detail: z.string().trim().max(5000).optional(),
  urgencyLevel: z.coerce.number().int().min(1).max(4).default(1),
  secretLevel: z.coerce.number().int().min(0).max(3).default(0),
  recipientMode: z.enum([
    "all_schools",
    "selected_schools",
    "book_group",
    "saraban",
  ]),
  groupId: z.coerce.number().int().positive().optional(),
  schoolIds: z.array(z.coerce.number().int().positive()).optional(),
  isCirculation: z
    .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true" || v === "1"),
});

export type BookCreateInput = z.infer<typeof bookCreateSchema>;
