import { z } from "zod";

export const studentFormSchema = z.object({
  edYear: z.coerce
    .number()
    .int()
    .min(2500, "ปีการศึกษาไม่ถูกต้อง")
    .max(2700, "ปีการศึกษาไม่ถูกต้อง"),
  schoolCode: z.string().trim().min(1, "กรุณาเลือกโรงเรียน").max(15),
  studentId: z
    .string()
    .trim()
    .min(1, "กรุณาระบุเลขประจำตัวนักเรียน")
    .max(15),
  personId: z
    .string()
    .trim()
    .regex(/^\d{13}$/, "เลขประจำตัวประชาชนต้อง 13 หลัก"),
  prename: z.string().trim().min(1, "กรุณาระบุคำนำหน้า").max(20),
  name: z.string().trim().min(1, "กรุณาระบุชื่อ").max(50),
  surname: z.string().trim().min(1, "กรุณาระบุนามสกุล").max(50),
  sex: z.enum(["ช", "ญ"], { message: "กรุณาเลือกเพศ" }),
  classLevel: z.coerce
    .number()
    .int()
    .min(1, "กรุณาเลือกชั้น")
    .max(15, "ชั้นไม่ถูกต้อง"),
  classroom: z.coerce.number().int().min(1, "ห้องต้องไม่น้อยกว่า 1").max(99),
});

export const studentEdYearFormSchema = z.object({
  edYear: z.coerce
    .number()
    .int()
    .min(2500, "ปีการศึกษาไม่ถูกต้อง")
    .max(2700, "ปีการศึกษาไม่ถูกต้อง"),
  yearActive: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
});

export const studentPermissionFormSchema = z.object({
  userId: z.coerce.number().int().positive("กรุณาเลือกบุคลากร"),
  p1: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === "on",
    z.boolean(),
  ),
  p2: z.preprocess(
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
