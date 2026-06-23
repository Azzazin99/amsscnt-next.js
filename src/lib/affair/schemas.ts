import { z } from "zod";

export const affairFormSchema = z.object({
  affairDate: z.string().trim().min(1, "กรุณาระบุวันที่"),
  affairTime: z.string().trim().min(1, "กรุณาระบุเวลา").max(50),
  subject: z.string().trim().min(1, "กรุณาระบุเรื่องภารกิจ").max(150),
  location: z.string().trim().min(1, "กรุณาระบุสถานที่").max(150),
  operationPersonId: z
    .string()
    .trim()
    .regex(/^\d{13}$/, "กรุณาเลือกผู้ปฏิบัติ"),
  remark: z
    .string()
    .trim()
    .max(150)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export const affairPermissionFormSchema = z.object({
  userId: z.coerce.number().int().positive("กรุณาเลือกบุคลากร"),
  p1: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  officerPersonId: z
    .string()
    .trim()
    .optional()
    .transform((v) => {
      if (!v || v.length === 0) return null;
      return v;
    })
    .refine((v) => v === null || /^\d{13}$/.test(v), {
      message: "เลขบัตรเจ้าหน้าที่ต้อง 13 หลัก",
    }),
});
