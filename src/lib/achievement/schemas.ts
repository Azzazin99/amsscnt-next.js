import { z } from "zod";

const scoreField = z.coerce.number().min(0, "คะแนนต้องไม่ติดลบ").max(100, "คะแนนสูงสุด 100");

export const achievementScoreFormSchema = z.object({
  testType: z.coerce
    .number()
    .int()
    .refine((v) => v === 1 || v === 2, "กรุณาเลือกประเภทการสอบ"),
  testClass: z.coerce.number().int().min(1, "กรุณาเลือกชั้น"),
  edYear: z.coerce
    .number()
    .int()
    .min(2500, "ปีการศึกษาไม่ถูกต้อง")
    .max(2700, "ปีการศึกษาไม่ถูกต้อง"),
  schoolCode: z.string().trim().min(1, "กรุณาเลือกโรงเรียน").max(12),
  thai: scoreField,
  math: scoreField,
  science: scoreField,
  social: scoreField,
  english: scoreField,
  health: scoreField,
  art: scoreField,
  vocation: scoreField,
});

export const achievementPermissionFormSchema = z.object({
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
