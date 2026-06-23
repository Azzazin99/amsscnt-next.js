import { z } from "zod";

export const idocumentFormSchema = z.object({
  workgroup: z.coerce.number().int().positive("กรุณาเลือกส่วนราชการ"),
  workgroupTxt: z.string().trim().min(1, "กรุณาระบุส่วนราชการ"),
  subject: z.string().trim().min(1, "กรุณาระบุเรื่อง"),
  bookTo: z.string().trim().min(1, "กรุณาระบุเรียน"),
  content1: z.string().trim().min(1, "กรุณาระบุเรื่องเดิม"),
  content2: z.string().trim().min(1, "กรุณาระบุข้อเท็จจริง"),
  content3: z.string().trim().min(1, "กรุณาระบุจึงเรียนมาเพื่อ"),
  bookType: z.coerce.number().int().min(0).max(3),
  recipientPersonId: z
    .string()
    .trim()
    .regex(/^\d{13}$/, "กรุณาเลือกผู้รับเสนอ"),
});

export type IdocumentFormValues = z.infer<typeof idocumentFormSchema>;
