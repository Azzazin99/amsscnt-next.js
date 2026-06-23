import { z } from "zod";

export const spacialStudentFormSchema = z.object({
  personId: z
    .string()
    .trim()
    .regex(/^\d{13}$/, "เลขประจำตัวประชาชนต้อง 13 หลัก"),
  schoolCode: z.string().trim().min(1, "กรุณาเลือกโรงเรียน").max(15),
  disableType: z.coerce
    .number()
    .int()
    .min(1, "กรุณาเลือกประเภทความพิการ")
    .max(9, "ประเภทไม่ถูกต้อง"),
  disableDetail: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => v ?? ""),
  other: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => v ?? ""),
  status: z.coerce.number().int().min(0).max(9).default(0),
});

export const spacialStudentPermissionFormSchema = z.object({
  userId: z.coerce.number().int().positive("กรุณาเลือกบุคลากร"),
  p1: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  p2: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  p3: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  officerPersonId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine((v) => v === null || /^\d{13}$/.test(v), {
      message: "เลขบัตรเจ้าหน้าที่ต้อง 13 หลัก",
    }),
});
